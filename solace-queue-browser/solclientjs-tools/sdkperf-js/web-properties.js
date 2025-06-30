// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    solace.PubSubTools.WebPropertiesState = function (values) {
        var key;

        for (key in values) {
            if (typeof(values[key] !== 'function')) {
                this[key] = values[key];
            }
        }
    };

    solace.PubSubTools.WebPropertiesState.prototype.toString = function () {
        var key;
        var result = new solace.StringBuffer();

        for (key in this) {
            if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                result.append(key + '=' + this[key] + '\n');
            }
        }
        return result.toString();
    };

    solace.PubSubTools.WebPropertiesState.prototype.toQueryString = function () {
        var key;
        var result = new solace.StringBuffer("?");

        for (key in this) {
            if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                result.append(key + '=' + this[key] + '&');
            }
        }
        return encodeURI(result.toString());
    };

    solace.PubSubTools.WebPropertiesState.prototype.fromString = function (string) {
        var i;
        var key, value;
        var runtimeProperites = solace.PubSubTools.webProperties.getRuntimeProperties();

        var lines = string.split('\n');

        for (i = 0; i < lines.length; ++i) {
            key   = lines[i].split('=')[0];
            value = lines[i].split('=')[1];

            if (runtimeProperites.hasOwnProperty(key) &&
                typeof(runtimeProperites[key]) !== 'function') {

                if (runtimeProperites[key].type === 'boolean') {
                    value = (value === 'true' ? true : false);
                }

                this[key] = value;
                solace.PubSubTools.webProperties.setProperty(key, value);
            }
        }
    };

    solace.PubSubTools.webProperties = (function () {

        // This is a list of element id's that will disabled at runtime.
        var disableAtRuntime = [];

        var runtimeProperties = new solace.PubSubTools.RuntimeProperties();

        return {
            getRuntimeProperties: function () {
                return runtimeProperties;
            },

            getProperty: function (key) {
                if (typeof(runtimeProperties[key]) !== 'undefined') {
                    return runtimeProperties[key].value;
                } else {
                    return undefined;
                }
            },

            setProperty: function (property, value) {
                var i, bgColor;

                var defaultValues = runtimeProperties.getDefaultValues();

                if (!runtimeProperties.hasOwnProperty(property)) {
                    return;
                }

                runtimeProperties.setProperty(property, value);

                if (value === defaultValues[property]) {
                    bgColor = "#ffffff";
                } else {
                    bgColor = "#fdf5ce";
                }

                for (i = 0; i < runtimeProperties[property].idList.length; ++i) {
                    if (runtimeProperties[property].type === "string" ||
                        runtimeProperties[property].type  === "number" ||
                        runtimeProperties[property].type === "float") {
                        solace.PubSubTools.utils.setText(runtimeProperties[property].idList[i], value);
                    } else if (runtimeProperties[property].type === "boolean") {
                        solace.PubSubTools.utils.setCheckbox(runtimeProperties[property].idList[i], value);
                    } else if (runtimeProperties[property].type === "select") {
                        solace.PubSubTools.utils.setSelected(runtimeProperties[property].idList[i], value);
                    }
                    solace.PubSubTools.utils.setBackgroundColor(runtimeProperties[property].idList[i], bgColor);
                }

            },

            reset: function () {
                var prop, i;

                var defaultValues = runtimeProperties.getDefaultValues();

                for (prop in runtimeProperties) {
                    if (runtimeProperties.hasOwnProperty(prop) &&
                        typeof(runtimeProperties[prop]) !== 'function') {

                        this.setProperty(prop, defaultValues[prop]);
                    }
                }
            },

            disableAtRuntime: function (fieldId) {
                disableAtRuntime.push(fieldId);
            },

            enableInputs: function (state) {
                var key, i;

                for (key in runtimeProperties) {
                    if (runtimeProperties.hasOwnProperty(key) &&
                        typeof(runtimeProperties[key]) !== 'function' &&
                        typeof(runtimeProperties[key].idList) !== 'undefined') {

                        for (i = 0; i < runtimeProperties[key].idList.length; ++i) {
                            solace.PubSubTools.utils.enableElement(runtimeProperties[key].idList[i], state);
                        }
                    }
                }

                for (i=0; i < disableAtRuntime.length; ++i) {
                    solace.PubSubTools.utils.setButtonState(disableAtRuntime[i], state);
                }
            },

            updateProperty: function (name, inputId) {
                var value, i;

                if (typeof(runtimeProperties[name]) === 'undefined') {
                    throw new solace.PubSubTools.PubSubError("Attempt to update undefined property: " + name);
                }

                // TODO: Proper validation of input.  For now, just force the type.
                switch (runtimeProperties[name].type) {

                    case 'string':
                        value = solace.PubSubTools.utils.getField(inputId);
                        break;

                    case 'number':
                        value = parseInt(solace.PubSubTools.utils.getField(inputId), 10) || 0;
                        break;

                    case 'float':
                        value = parseFloat(solace.PubSubTools.utils.getField(inputId), 10) || 0;
                        break;

                    case 'boolean':
                        value = solace.PubSubTools.utils.getCheckbox(inputId);
                        break;

                    case 'select':
                        value = solace.PubSubTools.utils.getSelected(inputId);
                        if (!isNaN(parseInt(value,10))) {
                            value = parseInt(value, 10)
                        }
                        break;

                    default:
                        throw new solace.PubSubTools.PubSubError("Unhandled property type: " + runtimeProperties[name].type);
                }

                this.setProperty(name, value);
            },


            updateAllProperties: function () {
                var key;

                for (key in runtimeProperties) {
                    if (runtimeProperties.hasOwnProperty(key) &&
                        typeof(runtimeProperties[key]) !== 'function' &&
                        typeof(runtimeProperties[key].idList) !== 'undefined' &&
                        runtimeProperties[key].idList[0] !== undefined) {

                        this.updateProperty(key, runtimeProperties[key].idList[0]);
                    }
                }
            },

            getSubscriptionTopicLists: function () {
                var i;

                var subscriptionTopicList   = [];  // The full list of subscription topics
                var subscriptionTopicLists  = [];  // A list of subscription topic lists for each client.

                if (runtimeProperties.subscribeTopicList.value !== "") {
                    subscriptionTopicList = this.getProperty("subscribeTopicList").split(',');
                }

                // Add the subscriptions from the topic list to each of the clients in a round robin manner.
                for (i = 0; i < subscriptionTopicList.length; ++i) {
                    if (i < runtimeProperties.clientNum.value) {
                        subscriptionTopicLists.push([subscriptionTopicList[i]]);
                    } else {
                        subscriptionTopicLists[i % runtimeProperties.clientNum.value].push(subscriptionTopicList[i]);
                    }
                }

                return subscriptionTopicLists;
            },

            getSubscriptionQueueLists: function () {
                var i;

                var subscriptionQueueList   = [];  // The full list of subscription topics
                var subscriptionQueueLists  = [];  // A list of subscription topic lists for each client.

                if (runtimeProperties.subscribeQueueList.value !== "") {
                    subscriptionQueueList = this.getProperty("subscribeQueueList").split(',');
                }

                // Add the subscriptions from the topic list to each of the clients in a round robin manner.
                for (i = 0; i < subscriptionQueueList.length; ++i) {
                    if (i < runtimeProperties.clientNum.value) {
                        subscriptionQueueLists.push([subscriptionQueueList[i]]);
                    } else {
                        subscriptionQueueLists[i % runtimeProperties.clientNum.value].push(subscriptionQueueList[i]);
                    }
                }

                return subscriptionQueueLists;
            },

            getSubscriptionDteLists: function() {

                var i;

                var subscriptionDteList   = [];  // The full list of subscription topics
                var subscriptionDteLists  = [];  // A list of subscription topic lists for each client.

                if (runtimeProperties.subscribeDteList.value !== "") {
                    subscriptionDteList = this.getProperty("subscribeDteList").split(',');
                }

                // Add the subscriptions from the topic list to each of the clients in a round robin manner.
                for (i = 0; i < subscriptionDteList.length; ++i) {
                    if (i < runtimeProperties.clientNum.value) {
                        subscriptionDteLists.push([subscriptionDteList[i]]);
                    } else {
                        subscriptionDteLists[i % runtimeProperties.clientNum.value].push(subscriptionDteList[i]);
                    }
                }

                return subscriptionDteLists;
            },

            getTemporaryTopicEndpoints: function() {
                // NUM_TEMP_TOPIC_ENDPOINTS
                var temporaryTopicEndpoints = this.getProperty("temporaryTopicEndpoints"); // -tte
                return temporaryTopicEndpoints;
            },

            getTemporaryQueueEndpoints: function() {
                // NUM_TEMP_QUEUE_ENDPOINTS
                var temporaryQueueEndpoints = this.getProperty("temporaryQueueEndpoints"); // -tqe
                return temporaryQueueEndpoints;
            },

            getState: function (wantFullState) {
                var key;
                var values = {};

                var defaultValues = runtimeProperties.getDefaultValues();

                this.updateAllProperties();

                for (key in runtimeProperties) {
                    if (runtimeProperties.hasOwnProperty(key) &&
                        typeof(runtimeProperties[key]) !== 'function') {

                        // Only values that are different from their default will be included in the result.
                        if (wantFullState === true || runtimeProperties[key].value !== defaultValues[key]) {
                            values[key] = runtimeProperties[key].value;
                        }
                    }
                }

                return new solace.PubSubTools.WebPropertiesState(values);
            },

            setState: function (state) {
                var key;

                for (key in state) {
                    if (runtimeProperties.hasOwnProperty(key) &&
                        typeof(runtimeProperties[key]) !== 'function') {

                        if (runtimeProperties[key].type === 'number') {
                            state[key] = parseInt(state[key], 10) || 0;
                        } else if (runtimeProperties[key].type === 'float') {
                            state[key] = parseFloat(state[key], 10) || 0;
                        }

                        this.setProperty(key, state[key]);
                    }
                }
            }
        };

    }());

}.apply(solace.PubSubTools));