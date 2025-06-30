// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true, log4javascript:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    solace.PubSubTools.log = (function () {

        var logLevel;

        var remoteLogAddress;

        var remoteLogger = log4javascript.getLogger();

        var appendToConsole = function(message) {
            var length;

            length = solace.PubSubTools.utils.appendLineToTextArea("pub-sub-tools-log", message);

            if (solace.PubSubTools.webEngine.getScrollLock("log-scroll-lock") === false) {
                $('#pub-sub-tools-log').scrollTop(length);
            }
        };

        var appendToMessages = function(message) {
            var length;

            length = solace.PubSubTools.utils.appendLineToTextArea("pub-sub-tools-messages", message);

            if (solace.PubSubTools.webEngine.getScrollLock("messages-scroll-lock") === false) {
                $('#pub-sub-tools-messages').scrollTop(length);
            }
        };

        var argsToString = function(level, args) {
            var text = "";
            if (args !== undefined && args.length > 0) {
                text = Array.prototype.slice.call(args, 0);
                text = text.join(" ");
                text = solace.PubSubTools.utils.currentDateTime() + " " + level.toUpperCase() + " " + text; 
            }
            return text;
        };
        
        return {

            trace: function () {
                if (logLevel !== undefined && logLevel >= solace.LogLevel.TRACE) {
                    var text = argsToString("TRACE", arguments);
                    appendToConsole(text);
                    remoteLogger.trace(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
                }
            },
            debug: function () {
                if (logLevel !== undefined && logLevel >= solace.LogLevel.DEBUG) {
                    var text = argsToString("DEBUG", arguments);
                    appendToConsole(text);
                    remoteLogger.debug(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
                }
            },
            info: function () {
                if (logLevel !== undefined && logLevel >= solace.LogLevel.WARN) {
                    var text = argsToString("INFO", arguments);
                    appendToConsole(text);
                    remoteLogger.info(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
                }
            },
            warning: function () {
                if (logLevel !== undefined && logLevel >= solace.LogLevel.WARN) {
                    var text = argsToString("WARN", arguments);
                    appendToConsole(text);
                    remoteLogger.warn(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
                }
            },
            warn: function () {
                if (logLevel !== undefined && logLevel >= solace.LogLevel.WARN) {
                    var text = argsToString("WARN", arguments);
                    appendToConsole(text);
                    remoteLogger.warn(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
                }
            },
            error: function () {
                if (logLevel !== undefined && logLevel >= solace.LogLevel.ERROR) {
                    var text = argsToString("ERROR", arguments);
                    appendToConsole(text);
                    remoteLogger.error(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
                }
            },
            fatal: function () {
                if (logLevel !== undefined && logLevel >= solace.LogLevel.FATAL) {
                    var text = argsToString("FATAL", arguments);
                    appendToConsole(text);
                    remoteLogger.fatal(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
                }
            },
            out: function (text) {
                text = solace.PubSubTools.utils.currentDateTime() + " " + text;
                appendToConsole(text);
                remoteLogger.info(solace.PubSubTools.webProperties.getProperty("clientNamePrefix") + " " + text);
            },
            message: function (message) {
                appendToMessages(message);
            },
            setRemoteLogAddress: function (address) {
                var ajaxAppender;
                remoteLogAddress = address;
                remoteLogger.removeAllAppenders();
                if (remoteLogAddress) {
                    ajaxAppender = new log4javascript.AjaxAppender(address);
                    ajaxAppender.setThreshold(log4javascript.Level.ALL);
                    remoteLogger.addAppender(ajaxAppender);
                }
            },
            setLogLevel: function (level) {
                logLevel = level;
            }
        };
    }());

}.apply(solace.PubSubTools));