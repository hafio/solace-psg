// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    // Initialize logging at ERROR level.  This can be changed at runtime using the web interface.
    var factoryProperties = new solace.SolclientFactoryProperties();
    factoryProperties.logger = solace.PubSubTools.log;
    factoryProperties.logLevel = solace.LogLevel.ERROR;
    solace.SolclientFactory.init(factoryProperties);

    solace.PubSubTools.AsyncErrorResponse = function (rc, errorInfo) {
        var result = {};
        result.rc         = rc;
        result.errorInfo  = errorInfo;
        return result;
    };


    solace.PubSubTools.asyncResponseRc = {
        OK:         0,
        FAIL:       1,
        TIMEOUT:    1
    };


    // Commonly used response
    solace.PubSubTools.asyncResponse = {
        OK:     {rc: 0}
    };


    solace.PubSubTools.AsyncTask = function AsyncTask (callback, errorEvent) {
        this.m_onComplete = callback;
        this.m_subTaskList = [];
        // If an error event is specified for the task
        this.errorEvent = errorEvent;
    };


    solace.PubSubTools.AsyncTask.prototype.addSubTask = function (clientIndex, eventType) {
        this.m_subTaskList.push({
            clientIndex:    clientIndex,
            eventType:      eventType
        });
    };


    solace.PubSubTools.AsyncTask.prototype.isDone = function () {
        return ((this.m_subTaskList.length === 0));
    };

    solace.PubSubTools.AsyncTask.prototype.setDone = function (clientIndex, eventType) {
        var i;

        for (i = 0; i < this.m_subTaskList.length; ++i) {
            if (this.m_subTaskList[i].clientIndex === clientIndex &&
                    this.m_subTaskList[i].eventType === eventType) {
                this.m_subTaskList.splice(i, 1);
            }
        }

        if (this.isDone()) {
            solace.PubSubTools.log.debug("[AsyncTask.SetDone] - Sending 'OK' response");
            this.m_onComplete(solace.PubSubTools.asyncResponse.OK);
        }
    };
    
    solace.PubSubTools.AsyncTask.prototype.setError = function (clientIndex, eventType, error) {

        if (eventType === this.errorEvent) {
            // Send error response
            solace.PubSubTools.log.debug("[AsyncTask.SetDone] - Sending Error response");
            this.m_onComplete(solace.PubSubTools.AsyncErrorResponse(solace.PubSubTools.asyncResponseRc.FAIL, error));
            return true;
        }
        for (var i = 0; i < this.m_subTaskList.length; ++i) {
            if (this.m_subTaskList[i].eventType === eventType &&
                this.m_subTaskList[i].clientIndex === clientIndex) {
                // Send error response
                solace.PubSubTools.log.debug("[AsyncTask.SetDone] - Sending Error response");
                this.m_onComplete(solace.PubSubTools.AsyncErrorResponse(solace.PubSubTools.asyncResponseRc.FAIL, error));
                return true;
            }
        }
        return false;
    };
        
    solace.PubSubTools.AsyncTask.prototype.start = function (timeout, infoStr) {

        var self = this;

        if (this.isDone()) {
            solace.PubSubTools.log.debug("[AsyncTask.start] - Sending 'OK' response");
            this.m_onComplete(solace.PubSubTools.asyncResponse.OK);
        } else {
            if (timeout > 0) {
                setTimeout(function () {
                    if (!self.isDone()) {
                        solace.PubSubTools.log.debug("[AsyncTask.start] - Sending timeout response");
                        self.m_onComplete(solace.PubSubTools.AsyncErrorResponse(solace.PubSubTools.asyncResponseRc.TIMEOUT, infoStr));
                    }
                }, timeout);
            }
        }
    };

    solace.PubSubTools.setLogLevel = function (logLevel) {
        solace.SolclientFactory.setLogLevel(logLevel);
        solace.PubSubTools.log.setLogLevel(logLevel);
    };

    /**
     * @class
     * Represents a collection of clients.
     */
    solace.PubSubTools.PerfClientCollection = function PerfClientCollection (clientProperties, statsProperties) {

        var client;
        var i;

        this.ALL_CLIENTS_INDEX      = -1;

        this.m_clientList           = [];
        this.m_clientProperties     = clientProperties;

        this.m_rxStatsProperites    = statsProperties;

        this.m_pubMonitorList       = [];
        this.m_cachePubMonitorList  = [];

        this.m_asyncTaskList        = [];
        
        this.m_stopPublishRequired  = false;
        this.m_stopCacheRequired    = false;

        for (i = 0; i < this.m_clientProperties.clientNum; ++i) {

            client = new solace.PubSubTools.Client(i + 1,  this.m_clientProperties, statsProperties);

            this.m_clientList.push(client);

            this.m_pubMonitorList.push(new solace.PubSubTools.PubMonitor(client));

            this.m_cachePubMonitorList.push(new solace.PubSubTools.CachePubMonitor(client));
        }
    };

    solace.PubSubTools.PerfClientCollection.prototype.connect = function (callback) {
        // If the init fails from CustomConfigure (The client creation above)
        // the m_session will be undefined and m_lastErrorResponse will be set
        // Throw the m_lastErrorResponse so it's as if they go the error from init
        if (this.m_clientList[0].m_session === undefined) {
            throw this.m_clientList[0].m_lastErrorResponse;
        }

        var i;
        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;
            var numHosts = this.m_clientList[0].m_session.getSessionProperties().url.length;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);

            for (i = 0; i < this.m_clientList.length; ++i) {
                if (!this.m_clientList[i].isConnected()) {
                    asyncTask.addSubTask(i, "CONNECT_EVENT");

                    this.m_clientList[i].registerEventCallback("CONNECT_EVENT", this.createNotifyCallback(i, "CONNECT_EVENT"));                      

                    var connectRetriesPerHost = this.m_clientList[i].m_session.getSessionProperties().connectRetriesPerHost;
                    var connectRetries = this.m_clientList[i].m_session.getSessionProperties().connectRetries;
                    var connectTimeoutInMsecs = this.m_clientList[i].m_session.getSessionProperties().connectTimeoutInMsecs;
                    
                    timeout = Math.max(timeout, (numHosts * connectTimeoutInMsecs * (1 + connectRetriesPerHost) * (1 + connectRetries)));
                }
            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "Unable to start all clients after " + timeout + " milliseconds.");
        }

        for (i = 0; i < this.m_clientList.length; ++i) {
            this.m_clientList[i].connect();
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.disconnect = function (callback) {
        var i;

        if (callback !== undefined && this.m_clientList[0].m_session !== undefined) {
            var asyncTask;
            var timeout = 0;
            var numHosts = this.m_clientList[0].m_session.getSessionProperties().url.length;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);

            for (i = 0; i < this.m_clientList.length; ++i) {
                if (this.m_clientList[i].isConnected()) {
                    asyncTask.addSubTask(i, solace.SessionEventCode.DISCONNECTED);

                    this.m_clientList[i].registerEventCallback(
                        solace.SessionEventCode.DISCONNECTED,
                        this.createNotifyCallback(i, solace.SessionEventCode.DISCONNECTED));

                    
                    var connectRetriesPerHost = this.m_clientList[i].m_session.getSessionProperties().connectRetriesPerHost;
                    var connectRetries = this.m_clientList[i].m_session.getSessionProperties().connectRetries;
                    var connectTimeoutInMsecs = this.m_clientList[i].m_session.getSessionProperties().connectTimeoutInMsecs;
                    
                    timeout = Math.max(timeout, (numHosts * connectTimeoutInMsecs * (1 + connectRetriesPerHost) * (1 + connectRetries)));
                }
            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "Unable to disconnect all clients after " + timeout + " milliseconds.");
        }

        for (i = 0; i < this.m_clientList.length; ++i) {
            this.m_clientList[i].disconnect();
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.dispose = function () {
        var i;

        for (i = 0; i < this.m_clientList.length; ++i) {
            this.m_clientList[i].dispose();
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.isConnected = function () {
        var i;

        for (i = 0; i < this.m_clientList.length; ++i) {
            if (!this.m_clientList[i].isConnected()) {
                return false;
            }
        }

        return true;
    };

    solace.PubSubTools.PerfClientCollection.prototype.queueUpdate = function (subscriptionsList, isAdding, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS, clientIndex, callback) {
        var i;

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);
            // Set timeout to 30 seconds
            timeout = 30000;

            if (clientIndex === this.ALL_CLIENTS_INDEX) {
                for (i = 0; i < this.m_clientList.length; ++i) {
                    asyncTask.addSubTask(i, "endpointUpdate");

                    this.m_clientList[i].registerEventEmitterEventCb(
                        "endpointUpdate",
                        this.createNotifyCallback(i, "endpointUpdate"));
                }
            } else {
                asyncTask.addSubTask(clientIndex, "endpointUpdate");

                this.m_clientList[clientIndex].registerEventEmitterEventCb(
                        "endpointUpdate",
                        this.createNotifyCallback(clientIndex, "endpointUpdate"));
            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "Queue update timeout after " + timeout + " milliseconds.");
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].queueUpdate(subscriptionsList, isAdding, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS);
            }
        } else {
            this.m_clientList[clientIndex].queueUpdate(subscriptionsList, isAdding, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS);
        }
    };

    solace.PubSubTools.PerfClientCollection.prototype.topicUpdate = function (endpointList, topicsList, isAdding, unsubscribeTopic, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS, clientIndex, callback) {
        var i;

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);
            // Set timeout to 30 seconds
            timeout = 30000;
            
            if (clientIndex === this.ALL_CLIENTS_INDEX) {
                for (i = 0; i < this.m_clientList.length; ++i) {
                    asyncTask.addSubTask(i, "endpointUpdate");

                    this.m_clientList[i].registerEventEmitterEventCb(
                        "endpointUpdate",
                        this.createNotifyCallback(i, "endpointUpdate"));
                }
            } else {
                asyncTask.addSubTask(clientIndex, "endpointUpdate");

                this.m_clientList[clientIndex].registerEventEmitterEventCb(
                        "endpointUpdate",
                        this.createNotifyCallback(clientIndex, "endpointUpdate"));
            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "Topic update timeout after " + timeout + " milliseconds.");
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].topicUpdate(endpointList, topicsList, isAdding, unsubscribeTopic, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS);
            }
        } else {
            this.m_clientList[clientIndex].topicUpdate(endpointList, topicsList, isAdding, unsubscribeTopic, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS);
        }
    };

    solace.PubSubTools.PerfClientCollection.prototype.tempEndpointUpdate = function(isTe, numEps, topicsList, selectorsList, maxMsgSize, quota, epPermission, respectTTL, noLocal,
                                                                                    activeFlowInd, discardNotifySender, maxMsgRedelivery, sessionName, clientIndex, accessType,
                                                                                    wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, 
                                                                                    requiredSettlements, settlementPatterns, callback) {
        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        var i;
        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);

            if (clientIndex === this.ALL_CLIENTS_INDEX) {
                for (i = 0; i < this.m_clientList.length; ++i) {
                    asyncTask.addSubTask(i, "endpointUpdate");

                    this.m_clientList[i].registerEventEmitterEventCb(
                        "endpointUpdate",
                        this.createNotifyCallback(i, "endpointUpdate"));

                    timeout = Math.max(timeout, this.m_clientList[i].m_session.getSessionProperties().readTimeoutInMsecs);
                }
            } else {
                asyncTask.addSubTask(clientIndex, "endpointUpdate");

                this.m_clientList[clientIndex].registerEventEmitterEventCb(
                        "endpointUpdate",
                        this.createNotifyCallback(clientIndex, "endpointUpdate"));

                timeout = this.m_clientList[clientIndex].m_session.getSessionProperties().readTimeoutInMsecs;
            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "tempEndpointUpdate timeout.");
        }
		
		if (typeof topicsList === 'string' || topicsList instanceof String) {
		  topicsList = topicsList.split(',');
		}

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].tempEndpointUpdate(isTe, numEps, topicsList, selectorsList, maxMsgSize, quota, epPermission, respectTTL, noLocal,
                                                        activeFlowInd, discardNotifySender, maxMsgRedelivery, sessionName, clientIndex, accessType, wantReplay, wantReplayFromDate,
                                                        wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns);
            }
        } else {
            this.m_clientList[clientIndex].tempEndpointUpdate(isTe, numEps, topicsList, selectorsList, maxMsgSize, quota, epPermission, respectTTL, noLocal,
                                                              activeFlowInd, discardNotifySender, maxMsgRedelivery, sessionName, clientIndex, accessType, wantReplay, wantReplayFromDate, 
                                                              wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns);
        }
    };

    solace.PubSubTools.PerfClientCollection.prototype.endpointProvisioning = function(clientIndex, subscriptions, isTopicEndpoint, accessType, maxMsgSize, quota,
                                                                                        permission, respectTtl, discardNotifySender, maxMsgRedelivery, isAdding, callback) {

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        var i;
        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);
            // Set timeout to 30 seconds
            timeout = 30000;

            if (clientIndex === this.ALL_CLIENTS_INDEX) {
                for (i = 0; i < this.m_clientList.length; ++i) {
                    asyncTask.addSubTask(i, solace.SessionEventCode.PROVISION_OK);
                    this.m_clientList[i].registerEventCallback(
                            solace.SessionEventCode.PROVISION_OK,
                            this.createNotifyCallback(i, solace.SessionEventCode.PROVISION_OK));
                }
            } else {
                asyncTask.addSubTask(clientIndex, solace.SessionEventCode.PROVISION_OK);
                this.m_clientList[clientIndex].registerEventCallback(
                        solace.SessionEventCode.PROVISION_OK,
                        this.createNotifyCallback(clientIndex, solace.SessionEventCode.PROVISION_OK));
            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "Endpoint Provisioning timeout after " + timeout + " milliseconds.");
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].endpointProvisioning(subscriptions, isTopicEndpoint, accessType, maxMsgSize, quota, 
                                                            permission, respectTtl, discardNotifySender, maxMsgRedelivery, isAdding);
            }
        } else {
            this.m_clientList[clientIndex].endpointProvisioning(subscriptions, isTopicEndpoint, accessType, maxMsgSize, quota, 
                                                                permission, respectTtl, discardNotifySender, maxMsgRedelivery, isAdding);
        }
    };

    solace.PubSubTools.PerfClientCollection.prototype.unbindAllTempEndpoints = function(clientIndex, callback) {
        var i;
        if(clientIndex>(this.m_clientList.length-1)){
            // log error
            return;
        }

        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);

            if (clientIndex === this.ALL_CLIENTS_INDEX) {
                for (i = 0; i < this.m_clientList.length; ++i) {
                    asyncTask.addSubTask(i, solace.SessionEventCode.SUBSCRIPTION_OK);
                    this.m_clientList[i].registerEventCallback(
                            solace.SessionEventCode.SUBSCRIPTION_OK,
                            this.createNotifyCallback(i, solace.SessionEventCode.SUBSCRIPTION_OK));

                    timeout = Math.max(timeout, this.m_clientList[i].m_session.getSessionProperties().readTimeoutInMsecs);

                }
            } else {
                asyncTask.addSubTask(clientIndex, solace.SessionEventCode.SUBSCRIPTION_OK);
                this.m_clientList[clientIndex].registerEventCallback(
                        solace.SessionEventCode.SUBSCRIPTION_OK,
                        this.createNotifyCallback(clientIndex, solace.SessionEventCode.SUBSCRIPTION_OK));

                timeout = this.m_clientList[clientIndex].m_session.getSessionProperties().readTimeoutInMsecs;

            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "tempEndpointUpdate timeout.");
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].unbindAllTempEndpoints();
            }
        } else {
            this.m_clientList[clientIndex].unbindAllTempEndpoints();
        }
    };

    solace.PubSubTools.PerfClientCollection.prototype.mapTopics = function (queue, topicsArray, isAdding, clientIndex, callback) {
        var i;

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;

            asyncTask = new solace.PubSubTools.AsyncTask(callback);
            // Set timeout to 30 seconds
            timeout = 30000;

            if (clientIndex === this.ALL_CLIENTS_INDEX) {
                for (i = 0; i < this.m_clientList.length; ++i) {
                    asyncTask.addSubTask(i, "mapTopicsOk");
                    this.m_clientList[i].registerEventEmitterEventCb(
                        "mapTopicsOk",
                        this.createNotifyCallback(i, "mapTopicsOk"));
                }
            } else {
                asyncTask.addSubTask(clientIndex, "mapTopicsOk");
                this.m_clientList[clientIndex].registerEventEmitterEventCb(
                    "mapTopicsOk",
                    this.createNotifyCallback(clientIndex, "mapTopicsOk"));
            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "Map topics timeout after " + timeout + " milliseconds.");
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].mapTopics(queue, topicsArray, isAdding);
            }
        } else {
            this.m_clientList[clientIndex].mapTopics(queue, topicsArray, isAdding);
        }
    };

    solace.PubSubTools.PerfClientCollection.prototype.subscriptionUpdate = function (subscriptionsList, isAdding, clientIndex, callback) {
        var i;

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (callback !== undefined) {
            var asyncTask;
            var timeout = 0;

            asyncTask = new solace.PubSubTools.AsyncTask(callback, solace.SessionEventCode.SUBSCRIPTION_ERROR);

            if (clientIndex === this.ALL_CLIENTS_INDEX) {
                for (i = 0; i < this.m_clientList.length; ++i) {
                    asyncTask.addSubTask(i, solace.SessionEventCode.SUBSCRIPTION_OK);
                    this.m_clientList[i].registerEventCallback(
                        solace.SessionEventCode.SUBSCRIPTION_OK,
                        this.createNotifyCallback(i, solace.SessionEventCode.SUBSCRIPTION_OK));

                    this.m_clientList[i].registerEventCallback(
                        solace.SessionEventCode.SUBSCRIPTION_ERROR,
                        this.createNotifyCallback(i, solace.SessionEventCode.SUBSCRIPTION_ERROR));

                    timeout = Math.max(timeout, this.m_clientList[i].m_session.getSessionProperties().readTimeoutInMsecs);

                }
            } else {
                asyncTask.addSubTask(clientIndex, solace.SessionEventCode.SUBSCRIPTION_OK);
                this.m_clientList[clientIndex].registerEventCallback(
                    solace.SessionEventCode.SUBSCRIPTION_OK,
                    this.createNotifyCallback(clientIndex, solace.SessionEventCode.SUBSCRIPTION_OK));

                this.m_clientList[clientIndex].registerEventCallback(
                    solace.SessionEventCode.SUBSCRIPTION_ERROR,
                    this.createNotifyCallback(clientIndex, solace.SessionEventCode.SUBSCRIPTION_ERROR));

                timeout = this.m_clientList[clientIndex].m_session.getSessionProperties().readTimeoutInMsecs;

            }

            this.m_asyncTaskList.push(asyncTask);
            asyncTask.start(timeout, "Subscription update timeout after " + timeout + " milliseconds.");
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].subscriptionUpdate(subscriptionsList, isAdding);
            }
        } else {
            this.m_clientList[clientIndex].subscriptionUpdate(subscriptionsList, isAdding);
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.getTotalRxMessages = function () {
        var i;
        var total = 0;

        for (i = 0; i < this.m_clientList.length; ++i) {
            total += this.m_clientList[i].m_stats.getStat(solace.PubSubTools.perfStatType.numMsgsRecv);
        }

        return total;
    };


    solace.PubSubTools.PerfClientCollection.prototype.getPubStartTime = function () {
        var i;
        var startTime = Infinity;

        for (i = 0; i < this.m_pubMonitorList.length; ++i) {
            if (this.m_pubMonitorList[i].m_startTime !== Infinity) {
                if (this.m_pubMonitorList[i].m_startTime < startTime) {
                    startTime = this.m_pubMonitorList[i].m_startTime;
                }
            }
            if (this.m_cachePubMonitorList[i].m_startTime !== Infinity) {
                if (this.m_cachePubMonitorList[i].m_startTime < startTime) {
                    startTime = this.m_cachePubMonitorList[i].m_startTime;
                }
            }
        }

        return startTime;
    };


    solace.PubSubTools.PerfClientCollection.prototype.getPubEndTime = function () {
        var i;
        var endTime = -Infinity;

        for (i = 0; i < this.m_pubMonitorList.length; ++i) {
            if (this.m_pubMonitorList[i].m_endTime !== -Infinity) {
                if (this.m_pubMonitorList[i].m_endTime > endTime) {
                    endTime = this.m_pubMonitorList[i].m_endTime;
                }
            }
            if (this.m_cachePubMonitorList[i].m_endTime !== -Infinity) {
                if (this.m_cachePubMonitorList[i].m_endTime > endTime) {
                    endTime = this.m_cachePubMonitorList[i].m_endTime;
                }
            }
        }

        return endTime;
    };


    solace.PubSubTools.PerfClientCollection.prototype.getClientName = function (clientIndex) {
        var i;
        var names = [];

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                names.push(this.m_clientList[i].getClientName());
            }
        } else {
            names.push(this.m_clientList[clientIndex].getClientName());
        }

        return names;
    };


    solace.PubSubTools.PerfClientCollection.prototype.setClientName = function (name, clientIndex) {
        if (clientIndex < 0 || clientIndex >= this.m_clientList.length) {
            throw new solace.PubSubTools.PubSubError("PerfClientCollection: Client Index out of range.  " +
                    "Range (0-" + (this.m_clientList.length - 1) + "), Index used: " + clientIndex);
        }

        this.m_clientList[clientIndex].setClientName(name);
    };

    solace.PubSubTools.PerfClientCollection.prototype.updateAuthOnReconnect = function (clientIndex, accessToken, idToken) {

        if (typeof(clientIndex) !== "number") {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            var i;
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].updateAuthOnReconnect(accessToken, idToken);
            }
        } else {
            this.m_clientList[clientIndex].updateAuthOnReconnect(accessToken, idToken);
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.getRxStats = function (clientIndex) {
        var i;
        var rxStats, clientStats;

        if (typeof(clientIndex) !== "number") {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {

            rxStats = new solace.PubSubTools.PerfStats("Aggregate");

            for (i = 0; i < this.m_clientList.length; ++i) {
                clientStats = this.m_clientList[i].m_stats;
                rxStats.aggregate(clientStats);
            }

            return rxStats;

        } else {
            return this.m_clientList[clientIndex].m_stats;
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.getTxThroughput = function () {
        var messageRate;
        var pubStartTime    = this.getPubStartTime();
        var pubEndTime      = this.getPubEndTime();

        if (pubStartTime === Infinity) {
            return 0;
        }

        if (pubEndTime === -Infinity) {
            pubEndTime = (new Date()).getTime();
        }

        messageRate = this.getSdkStat("TX_TOTAL_DATA_MSGS") / ((pubEndTime - pubStartTime) / 1000);
        return messageRate.toFixed(2);
    };


    solace.PubSubTools.PerfClientCollection.prototype.getSdkStat = function (statType, clientIndex) {
        var i;
        var value = 0;

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                value += this.m_clientList[i].getSdkStat(statType);
            }
        } else {
            value = this.m_clientList[clientIndex].getSdkStat(statType);
        }

        return value;
    };


    solace.PubSubTools.PerfClientCollection.prototype.resetStats = function (clientIndex) {
        var i;

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            for (i = 0; i < this.m_clientList.length; ++i) {
                this.m_clientList[i].resetStats();
            }
        } else {
            this.m_clientList[clientIndex].resetStats();
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.generateMessageList = function (publishProps) {
        var i, j, x;
        var size;
        var remaining;
        var messageProps;
        var messageList     = [];
        var xmlPayloadsList = [];
        var attachmentsList = [];
        // Poor man's weighted random selection:
        // An array with 100 entries, 
        // elements repeating in proportion to the desired probability.
        var priorityProbabilityArray = [];

        var builderStr;

        var DEFAULT_PUB_XML_MSG_START_TAG   = "<x>";
        var DEFAULT_PUB_XML_MSG_END_TAG     = "</x>";

        var startTagLength  = DEFAULT_PUB_XML_MSG_START_TAG.length;
        var endTagLength    = DEFAULT_PUB_XML_MSG_END_TAG.length;
        var basicMsgLength  = startTagLength + endTagLength;

        var numDistinctToPublish = 1;

        if (publishProps.xmlSizeList !== undefined && publishProps.xmlSizeList.length > 0) {
            for (i = 0; i < publishProps.xmlSizeList.length; ++i) {

                size = publishProps.xmlSizeList[i];
                builderStr = new solace.StringBuffer("");

                if (size < basicMsgLength) {
                    throw new solace.PubSubTools.PubSubError("generateMessageList: Payload size " + size + " is too short.  Minimum is " + basicMsgLength);
                }

                remaining = size - basicMsgLength;

                builderStr.append(DEFAULT_PUB_XML_MSG_START_TAG);

                for (x = 0; x < parseInt(remaining/8, 10); ++x) {

                    builderStr.append(":" + ("0000000" + x.toString()).slice(-7));
                }

                remaining = size - builderStr.toString().length - endTagLength;

                for (x = 0; x < remaining; ++x) {
                    builderStr.append("x");
                }

                builderStr.append(DEFAULT_PUB_XML_MSG_END_TAG);

                xmlPayloadsList.push(builderStr.toString());
            }
        }

        if (publishProps.attachmentSizeList !== undefined && publishProps.attachmentSizeList.length > 0) {
            for (i = 0; i < publishProps.attachmentSizeList.length; ++i) {

                size = publishProps.attachmentSizeList[i];
                builderStr = new solace.StringBuffer("");

                for (x = 0; x < parseInt(size/8, 10); ++x) {
                    builderStr.append(":" + ("0000000" + x.toString(16)).slice(-7));
                }

                remaining = size - builderStr.toString().length;

                for (x = 0; x < remaining; ++x) {
                    builderStr.append("A");
                }

                attachmentsList.push(builderStr.toString());
            }
        }
        
        // populate priorityProbabilityArray for weighted random selection.
        // Should be a function and unit tested. 
        if (publishProps.msgPriorityList !== undefined && publishProps.msgPriorityList.length > 0) {
            // TODO: There has to be a simple way to convert an alternating key value list to a map.
            var probArrayIndex = 0;
          outerLoop:
            for (i = 0; i+1 < publishProps.msgPriorityList.length; i+=2) {
                var priority = parseInt(publishProps.msgPriorityList[i], 10); //const
                var probability = publishProps.msgPriorityList[i+1]; //const
                for (j = 0; j < probability ; j++) {
                  priorityProbabilityArray.push(priority);
                  probArrayIndex++;
                  if (probArrayIndex >= 100) {
                    // TODO: complain. Or normalize probabilities to 100 if larger.
                    break outerLoop;
                  }
                }
            }
        }
        publishProps.priorityProbabilityArray = priorityProbabilityArray;

        // Determine how many messages are required.

        if (xmlPayloadsList.length !== 0 &&
                numDistinctToPublish !== xmlPayloadsList.length) {
            numDistinctToPublish *= xmlPayloadsList.length;
        }

        if (attachmentsList.length !== 0 &&
                numDistinctToPublish !== attachmentsList.length) {
            numDistinctToPublish *= attachmentsList.length;
        }

        // If using message object type, we don't care about the attachment or xmlPayload list.
        // "reset" the numDistinctToPublish to the number of message object types.
        if (publishProps.messageObjectTypeList !== undefined && publishProps.messageObjectTypeList.length > 0) {
            numDistinctToPublish = publishProps.messageObjectTypeList.length;
        }

        if (publishProps.publishTopicList.length !== 0 &&
                numDistinctToPublish !== publishProps.publishTopicList.length) {
            numDistinctToPublish *= publishProps.publishTopicList.length;
        }

        if (publishProps.publishQueueList.length !== 0 &&
                numDistinctToPublish !== publishProps.publishQueueList.length) {
            numDistinctToPublish *= publishProps.publishQueueList.length;
        }

        if (publishProps.publishTopicList.length === 0 &&
                publishProps.publishQueueList.length === 0) {
            throw new solace.PubSubTools.PubSubError("Must specify at least one routable component (i.e. topic or queue)");
        }

        for (i = 0; i < numDistinctToPublish; ++i) {
            messageProps = new solace.PubSubTools.MessageProperties();

            if (xmlPayloadsList.length > 0) {
                messageProps.xmlPayload = xmlPayloadsList[i % xmlPayloadsList.length];
            }

            if (attachmentsList.length > 0) {
                messageProps.attachment = attachmentsList[i % attachmentsList.length];
            }

            if (publishProps.messageObjectTypeList !== undefined && publishProps.messageObjectTypeList.length > 0) {
                messageProps.messageObjectType = publishProps.messageObjectTypeList[i % publishProps.messageObjectTypeList.length];
            }

            if (publishProps.publishTopicList.length > 0) {
                messageProps.topic = publishProps.publishTopicList[i % publishProps.publishTopicList.length];
            }

            if (publishProps.publishQueueList.length > 0) {
                messageProps.queue = publishProps.publishQueueList[i % publishProps.publishQueueList.length];
            }

            if (publishProps.partitionKeyList !== "" && publishProps.partitionKeyList.length > 0) {
                messageProps.partitionKeyList = publishProps.partitionKeyList.split(',');
            }

            messageList.push(messageProps);
        }

        return messageList;
    };


    solace.PubSubTools.PerfClientCollection.prototype.startPublishing = function (publishProps) {

        var i;
        var msgsToPublish = [];
        var numMsgsPerClient;

        var startDelayUnitInMs;

        if (this.isPublishing()) {
            throw new solace.PubSubTools.PubSubError("Already publishing.  Must stop before calling start publishing.");
        }

        if (this.m_stopPublishRequired) {
            throw new solace.PubSubTools.PubSubError("Pubs currently stopped.  However, call to stop publishing required to be able to restart the pubs.");
        }

        msgsToPublish = this.generateMessageList(publishProps);
        numMsgsPerClient = publishProps.messageNum / this.m_clientProperties.clientNum;
        startDelayUnitInMs = 0;
        if (parseInt(publishProps.messageRate, 10) !== 0) {
            startDelayUnitInMs = 1000 / (publishProps.messageRate * this.m_clientProperties.clientNum);
        }

        try {
            for (i = 0; i < this.m_pubMonitorList.length; ++i) {

                this.m_pubMonitorList[i].configurePublish(msgsToPublish, publishProps, numMsgsPerClient);

                // To obtain smooth publishing for multiple low rate clients, we will delay the
                // publish start time between clients.
                this.m_pubMonitorList[i].run(i * startDelayUnitInMs);
            }
        } catch (error) {
            throw new solace.PubSubTools.PubSubError("Error while starting publisher:" + error.message);
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.stopPublishing = function () {
        var i;

        for (i = 0; i < this.m_pubMonitorList.length; ++i) {
            this.m_pubMonitorList[i].stopPublishing();
        }

        this.m_stopPublishRequired = false;
    };


    solace.PubSubTools.PerfClientCollection.prototype.isPublishing = function () {
        var i;
        var isPublishing = false;

        for (i = 0; i < this.m_pubMonitorList.length; ++i) {
            if (this.m_pubMonitorList[i].isPublishing() === true) {
                isPublishing = true;
                break;
            }
        }

        return isPublishing;
    };
    

    solace.PubSubTools.PerfClientCollection.prototype.donePublishing = function () {
        var i;
        var donePublishing = true;

        for (i = 0; i < this.m_pubMonitorList.length; ++i) {
            if (this.m_pubMonitorList[i].donePublishing() === false) {
                donePublishing = false;
                break;
            }
        }

        return donePublishing;
    };


    solace.PubSubTools.PerfClientCollection.prototype.publishMessage = function (publishProperties, clientIndex, callback) {
        var client, i;
        var messageList;

        var onConnect;
        var useCallback;

        var createOnConnect = function (client, publishProperties, messageList, useCallback) {
            return {
                onSuccess: function () {
                    client.updatePublishProps(publishProperties);
                    client.updateToolData(messageList[0], 1);
                    client.publishMessage(messageList[0]);
                    // Send response after the last client publishes
                    if (useCallback && (typeof (callback) !== 'undefined')) {
                        solace.PubSubTools.log.debug("[PublishMessage.Onconnect] - Sending 'OK' response");
                        callback(solace.PubSubTools.asyncResponse.OK);
                    }
                }
            };
        };

        if (this.isPublishing()) {
            throw new solace.PubSubTools.PubSubError("Already publishing.  Must stop before calling start publishing.");
        }

        messageList = this.generateMessageList(publishProperties);

        if (messageList.length > 1) {
            throw new solace.PubSubTools.PubSubError("Properties generated message list when trying to publish a single message.");
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            useCallback = false;
            for (i = 0; i < this.m_clientList.length; ++i) {
                if (i === (this.m_clientList.length - 1)) {
                    useCallback = true;
                }
                client = this.m_clientList[i];
                onConnect = createOnConnect(client, publishProperties, messageList, useCallback);

                if (client.isConnected()) {
                    onConnect.onSuccess();
                } else {
                    client.registerEventCallback(solace.SessionEventCode.UP_NOTICE, onConnect);
                    client.connect();
                }
            }
        } else {
            useCallback = true;
            client = this.m_clientList[clientIndex];
            onConnect = createOnConnect(client, publishProperties, messageList, useCallback);

            if (typeof(client) === 'undefined') {
                throw new solace.PubSubTools.PubSubError("Attempt to publish from non-existent client index: " + clientIndex);
            }

            if (client.isConnected()) {
                onConnect.onSuccess();
            } else {
                client.registerEventCallback(solace.SessionEventCode.UP_NOTICE, onConnect);
                client.connect();
            }
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.startCacheRequesting = function (cacheProps) {

        var i;
        var numRequestsPerClient;

        var startDelayUnitInMs;

        if (this.isCacheRequesting()) {
            throw new solace.PubSubTools.PubSubError("Already cache requesting.  Must stop before calling start cache requesting.");
        }

        if (this.m_stopCacheRequired) {
            throw new solace.PubSubTools.PubSubError("Cache requesting currently stopped.  However, call to stop cache requesting required to be able to restart.");
        }

        numRequestsPerClient = cacheProps.cacheRequestNumber / this.m_clientProperties.clientNum;
        startDelayUnitInMs = 1000 / (cacheProps.cacheRequestRate * this.m_clientProperties.clientNum);

        try {
            for (i = 0; i < this.m_cachePubMonitorList.length; ++i) {

                this.m_cachePubMonitorList[i].configurePublish(cacheProps, numRequestsPerClient);

                // To obtain smooth publishing for multiple low rate clients, we will delay the
                // publish start time between clients.
                this.m_cachePubMonitorList[i].run(i * startDelayUnitInMs);
            }
        } catch (error) {
            throw new solace.PubSubTools.PubSubError("Error while starting cache requesting:" + error.message);
        }
    };


    solace.PubSubTools.PerfClientCollection.prototype.stopCacheRequesting = function () {
        var i;

        for (i = 0; i < this.m_cachePubMonitorList.length; ++i) {
            this.m_cachePubMonitorList[i].stopCacheRequesting();
        }

        this.m_stopCacheRequired = false;

    };


    solace.PubSubTools.PerfClientCollection.prototype.isCacheRequesting = function () {
        var i;
        var isCacheRequesting = false;

        for (i = 0; i < this.m_cachePubMonitorList.length; ++i) {
            if (this.m_cachePubMonitorList[i].isCacheRequesting() === true) {
                isCacheRequesting = true;
                break;
            }
        }

        return isCacheRequesting;
    };


    solace.PubSubTools.PerfClientCollection.prototype.doneCacheRequesting = function () {
        var i;
        var doneCacheRequesting = true;

        for (i = 0; i < this.m_cachePubMonitorList.length; ++i) {
            if (this.m_cachePubMonitorList[i].doneCacheRequesting() === false) {
                doneCacheRequesting = false;
                break;
            }
        }

        return doneCacheRequesting;
    };


    solace.PubSubTools.PerfClientCollection.prototype.cacheRequest = function (topics, subscribe, liveDataAction, waitForConfirm, minSeq, maxSeq, clientIndex, callback) {
        var client, cacheRequestIdOffset, cacheRequestId, i;

        if (typeof(callback) !== 'undefined') {
            if (waitForConfirm === true) {
                var asyncTask;

                // A timeout that is < 0 is equivalent to no timeout.
                var timeout = -1;

                asyncTask = new solace.PubSubTools.AsyncTask(callback);

                for (i = 0; i < this.m_clientList.length; ++i) {

                    for (cacheRequestIdOffset = 0; cacheRequestIdOffset < topics.length; ++cacheRequestIdOffset) {

                        // We will be making a cache request per topic specified.  To keep track of when these finish,
                        // we need to register each topic as a sub task.
                        //
                        // NOTE: Notification handling was designed to handle regular session events.  These events
                        //  are defined by the API and have numerical values.  To avoid collisions we rely on the
                        //  fact that client cacheRequestId's start at 1000.
                        cacheRequestId = this.m_clientList[i].m_cacheRequestId + cacheRequestIdOffset;

                        asyncTask.addSubTask(i, cacheRequestId);

                        this.m_clientList[i].registerEventCallback(
                            cacheRequestId,
                            this.createNotifyCallback(i, cacheRequestId));
                    }
                }

                this.m_asyncTaskList.push(asyncTask);
                asyncTask.start(timeout, "Cache request timeout after " + timeout + " milliseconds.");

            }
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {

            for (i = 0; i < this.m_clientList.length; ++i) {
                client = this.m_clientList[i];

                client.cacheRequest(topics, subscribe, liveDataAction, waitForConfirm);
            }

        } else {
            client = this.m_clientList[clientIndex];

            if (typeof(client) === 'undefined') {
                throw new solace.PubSubTools.PubSubError("Attempt to cache request from non-existent client index: " + clientIndex);
            }

            client.cacheRequest(topics, subscribe, liveDataAction, waitForConfirm);
        }


    };


    solace.PubSubTools.PerfClientCollection.prototype.notifyCollection = function (clientIndex, eventType, error) {
        var i;

        for (i = 0; i < this.m_asyncTaskList.length; ++i) {

            if (error !== undefined) {
                var errorResponseSent = this.m_asyncTaskList[i].setError(clientIndex, eventType, error);
                if (errorResponseSent === true) {
                    // clear the task in case of error
                    this.m_asyncTaskList.splice(i--, 1);
                }
            } else {
                this.m_asyncTaskList[i].setDone(clientIndex, eventType);

                if (this.m_asyncTaskList[i].isDone()) {
                    this.m_asyncTaskList.splice(i--, 1);
                }
            }
        }
    };
    
    solace.PubSubTools.PerfClientCollection.prototype.createNotifyCallback = function (clientIndex, eventType) {
        var self = this;

        return {
            onSuccess: function () {
                self.notifyCollection(clientIndex, eventType);
            },

            onFailure: function (error) {
                self.notifyCollection(clientIndex, eventType, error);
            }
        };
    };
 
	solace.PubSubTools.PerfClientCollection.prototype.startData = function() {
		var i;
		for(i=0; i<this.m_clientList.length; i++) {
			this.m_clientList[i].startData();
		}
	};

	solace.PubSubTools.PerfClientCollection.prototype.stopData = function() {
		var i;
		for(i=0; i<this.m_clientList.length; i++) {
			this.m_clientList[i].stopData();
		}
	};

	solace.PubSubTools.PerfClientCollection.prototype.getRtrCapabilities = function() {
		var caps;
		if(this.m_clientList.length>0){
			caps = this.m_clientList[0].getRtrCapabilities();
		} else {
			solace.PubSubTools.log.error("Call to PerfClientCollection::getRtrCapabilities() failed because there are no clients");
			caps=null;
		}
		return caps;
    };
    
    solace.PubSubTools.PerfClientCollection.prototype.getChannelState = function() {
        var retState = "connected";
        if(this.m_clientList.length>0) {
            var i;
            for(i=0; i<this.m_clientList.length; i++) {
                var clientState = this.m_clientList[i].getChannelState();
                
                if( (clientState==="connecting" || clientState==="reconnecting") && retState!=="disconnected" ) {
                    retState = clientState;
                    continue;
                }

                if(clientState==="disconnected") {
                    retState = clientState;
                    break;
                }
            }
        } else {
            solace.PubSubTools.log.error("Call to PerfClientCollection::getChannelState() failed because there are no clients");
        }
        return retState;
    };

    solace.PubSubTools.PerfClientCollection.prototype.getLastMessageDetails = function(iClientIndex) {
		if(iClientIndex===this.ALL_CLIENTS_INDEX) {
			if(this.m_clientList!==undefined && this.m_clientList!==null && this.m_clientList.length>1) {
				solace.PubSubTools.log.info("PerfClientCollection: Cannot request last message details on all clients if there is more than 1 client in object");
			}
			iClientIndex = 0;
		}
		
		return this.m_clientList[iClientIndex].getLastMessageDetails();
	};

    solace.PubSubTools.PerfClientCollection.prototype.getLastMessagesDetails = function(iClientIndex, msgsToGet) {
		if(iClientIndex===this.ALL_CLIENTS_INDEX) {
			if(this.m_clientList!==undefined && this.m_clientList!==null && this.m_clientList.length>1) {
				solace.PubSubTools.log.info("PerfClientCollection: Cannot request last messages details error on all clients if there is more than 1 client in object");
			}
			iClientIndex = 0;
		}
		
		return this.m_clientList[iClientIndex].getLastMessagesDetails(msgsToGet);
	};
	
	solace.PubSubTools.PerfClientCollection.prototype.getLastError = function(iClientIndex) {
		if(iClientIndex===this.ALL_CLIENTS_INDEX) {
			if(this.m_clientList!==undefined && this.m_clientList!==null && this.m_clientList.length>1) {
				solace.PubSubTools.log.info("PerfClientCollection: Cannot request last error on all clients if there is more than 1 client in object");
			}
			iClientIndex = 0;
		}
		
		var err = this.m_clientList[iClientIndex].getLastError();
		return err;
	};
	
	solace.PubSubTools.PerfClientCollection.prototype.clearLastError = function(iClientIndex) {
		if(iClientIndex===this.ALL_CLIENTS_INDEX) {
			if(this.m_clientList!==undefined && this.m_clientList!==null && this.m_clientList.length>0) {
				var i;
				for(i=0; i<this.m_clientList.length; i++) {
					this.m_clientList[i].clearLastError();
				}
			}
		} else {
			this.m_clientList[iClientIndex].clearLastError();
		}
		return;
	};

    solace.PubSubTools.PerfClientCollection.prototype.getFlowStatus = function (epName, epType, clientIndex) {
        var flowStatus;

        if (typeof(clientIndex) !== 'number') {
            clientIndex = this.ALL_CLIENTS_INDEX;
        }

        if (clientIndex === this.ALL_CLIENTS_INDEX) {
            throw new solace.PubSubTools.PubSubError("PerfClientCollection: GetFlowStatus is only available on specific client index.  " +
            "Not ALL_CLIENT_INDEX"); 
        } else {
            if (clientIndex < 0 || clientIndex >= this.m_clientList.length) {
                throw new solace.PubSubTools.PubSubError("PerfClientCollection: Client Index out of range.  " +
                "Range (0-" + (this.m_clientList.length - 1) + "), Index used: " + clientIndex);
            }
            flowStatus = this.m_clientList[clientIndex].getFlowStatus(epName, epType);
        }

        return flowStatus;
    };
    
    solace.PubSubTools.PerfClientCollection.prototype.toString = function () {
        var buf = new solace.StringBuffer();
        for (var i = 0; i < this.m_clientList.length; ++i) {
            buf.append(this.m_clientList[i].toString());
        }
        return buf.toString();
    };

}.apply(solace.PubSubTools));
