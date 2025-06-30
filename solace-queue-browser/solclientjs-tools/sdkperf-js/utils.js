// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    // Solace.StringBuffer is part of the solclientjs library.  However, since we
    // want to use it as part of our generalized UI for multiple SDKs, we have
    // pulled it into here.
    solace.StringBuffer = function(varargs) {
        this.buffer = [];
        if (arguments.length === 1) {
            this.buffer.push(arguments[0]);
        }
    };

    solace.StringBuffer.prototype.append = function(string) {
        if (string !== undefined) {
            this.buffer.push(string);
        }
        return this;
    };

    solace.StringBuffer.prototype.toString = function() {
        return this.buffer.join("");
    };

    solace.PubSubTools.utils = (function () {

        var dateTimeVal = new Date();
        var dateTimeStr = "";

        return {
            byteArrayToStr: function (byteArray) {
                for (var i = 0; i < byteArray.length; i++) {
                    byteArray[i] = String.fromCharCode(byteArray[i]);
                }
                return byteArray.join("");
            },
            strToByteArray: function (str) {
                var arr = [];
                for (var i = 0; i < str.length; i++) {
                    arr.push(str.charCodeAt(i));
                }
                return arr;
            },
            getHostUrl: function () {

                var index1, index2, path;

                var hostUrl = '';

                // If we aren't running in a browser, our hostUrl will be blank.
                if (typeof(window) === 'undefined' ||
                    typeof(window.location) === 'undefined' ||
                    typeof(window.location.href) === 'undefined') {

                    return hostUrl;
                }

                path = window.location.href;
                index1 = path.indexOf('//');
                index2 = -1;

                if (index1 > 0) {
                    index2 = path.indexOf('/', index1+2);
                    if (index2 > 0) {
                        hostUrl = path.substring(0, index2);
                    }
                }
                return hostUrl;
            },
            getUrlVars: function () {
                var i;
                var keyValue;
                var keyValues   = decodeURI(window.location.href).slice(window.location.href.indexOf('?') + 1).split('&');
                var vars        = {};

                for(i = 0; i < keyValues.length; i++) {
                    keyValue = keyValues[i].split('=');
                    vars[keyValue[0]] = keyValue[1];
                }
                return vars;
            },
            appendLineToTextArea: function(textAreaId, line) {
                var message = line + "\n";
                var textArea = $("#" + textAreaId);
                var text = textArea.val();

                textArea.val(text + message);

                return text.length;
            },
            currentDateTime: function () {
                var date = new Date();
                var tzOffset;

                // Format the date/time at most twice per second.
                if (date - dateTimeVal > 500) {
                    dateTimeVal = date;
                    tzOffset = -date.getTimezoneOffset();
                    dateTimeStr = this.padLeft(date.getFullYear(), '0', 4) + "-" +
                        this.padLeft(date.getMonth() + 1, '0', 2) + "-" +
                        this.padLeft(date.getDate(), '0', 2) + "T" +
                        this.padLeft(date.getHours(), '0', 2) + ":" +
                        this.padLeft(date.getMinutes(), '0', 2) + ":" +
                        this.padLeft(date.getSeconds(), '0', 2) + "." +
                        this.padLeft(date.getMilliseconds(), '0', 3) +
                        (tzOffset < 0 ? "-" : "+") +
                        this.padLeft(Math.abs(tzOffset / 60), '0', 2) +
                        this.padLeft(date.getTimezoneOffset() % 60, '0', 2);
                }
                return dateTimeStr;
            },
            padLeft: function (str, padChar, length) {
                str = str + "";
                while (str.length < length) {
                    str = padChar + str;
                }
                return str;
            },
            getField: function(fieldId) {
                return $("#" + fieldId).val();
            },
            getCheckbox: function (fieldId) {
                return ($("#" + fieldId + ":checked").val() !== undefined);
            },
            setCheckbox: function (fieldId, value) {
                $("#" + fieldId).attr('checked', value).button("refresh");
            },
            getSelected: function (fieldId) {
                return $("#" + fieldId).val();
            },
            setSelected: function (fieldId, value) {
                $('#' + fieldId + ' option[value="' + value + '"]').attr('selected', 'selected');
            },
            setProgress: function (value) {
                if (typeof($) !== 'undefined') {
                    $('#test-progressbar').progressbar("value", value);
                }
            },
            setButtonState: function(controlId, state) {
                if (state) {
                    $("#" + controlId).button("enable");
                } else {
                    $("#" + controlId).button("disable");
                }
            },
            setLabelText: function(labelId, msg) {
                if (typeof($) !== 'undefined') {
                    $("#" + labelId).text(msg);
                }
            },
            enableElement: function(elementId, state) {
                if (!state) {
                    $('#' + elementId).attr('disabled', 'disabled');
                } else {
                    $('#' + elementId).removeAttr('disabled');
                }
            },
            setText: function(controlId, msg) {
                $('#' + controlId).val(msg);
            },
            setBackgroundColor: function (elementId, color) {
                $('#' + elementId).css('background-color', color);
            },
            oooDataToString: function (oooData) {
                var i;
                var startSeqNum, endSeqNum;
                var buf = new solace.StringBuffer();

                if (oooData.oooMessageIds.length > 0) {
                    buf.append("    ooo : ");
                    for (i = 0; i < oooData.oooMessageIds.length; ++i) {
                        if (oooData.oooMessageIds[i] !== undefined) {
                            buf.append("(" + oooData.oooMessageIds[i].messageId + ":" + oooData.oooMessageIds[i].previousMessageId + ") ");
                        }
                    }
                    buf.append("\n");
                }

                if (oooData.lostMessageIds.length > 0) {

                    startSeqNum = oooData.lostMessageIds[0];
                    endSeqNum = startSeqNum;

                    buf.append("    lost: ");
                    buf.append("(" + startSeqNum);

                    for (i = 0; i < oooData.lostMessageIds.length; ++i) {
                        if (oooData.lostMessageIds[i] > (endSeqNum + 1)) {
                            buf.append("-" + endSeqNum + ")");
                            startSeqNum = oooData.lostMessageIds[i];
                            endSeqNum = startSeqNum;
                            buf.append("(" + startSeqNum);
                        } else {
                            endSeqNum = oooData.lostMessageIds[i];
                        }
                    }
                    buf.append("-" + endSeqNum + ") \n");
                }

                if (oooData.duplicateMessageIds.length > 0) {
                    buf.append("    dup : ");
                    for (i = 0; i < oooData.duplicateMessageIds.length; ++i) {
                        if (oooData.duplicateMessageIds[i] !== undefined) {
                            buf.append(oooData.duplicateMessageIds[i] + " ");
                        }
                    }
                    buf.append("\n");
                }

                if (oooData.redeliveredDuplicateMessageIds.length > 0) {
                    buf.append("    dup : ");
                    for (i = 0; i < oooData.redeliveredDuplicateMessageIds.length; ++i) {
                        if (oooData.redeliveredDuplicateMessageIds[i] !== undefined) {
                            buf.append(oooData.redeliveredDuplicateMessageIds[i] + " ");
                        }
                    }
                    buf.append("\n");
                }

                return buf.toString();
            }
        };
    }());

}.apply(solace.PubSubTools));

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0); i < this.length; i++) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    };
}

// Source:
// http://www.lockencreations.com/2011/07/02/cant-debug-imported-js-files-when-using-jquery-getscript/
//
// Replace the normal jQuery getScript function with one that supports
// debugging and which references the script files as external resources
// rather than inline.
function dynamicallyLoadJSFile(url, callback){
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = url;

    // Handle Script loading
    var done = false;

    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function(){
        if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
            done = true;
            if (callback){
                callback();
            }
            // Handle memory leak in IE
            script.onload = script.onreadystatechange = null;
        }
    };
    head.appendChild(script);

    // We handle everything using the script element injection
    return undefined;
}