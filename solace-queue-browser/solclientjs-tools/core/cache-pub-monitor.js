// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {


    solace.PubSubTools.CachePubMonitor = function CachePubMonitor(client) {

        this.m_timerId              = null;
        this.m_timerInterval        = 25;

        this.m_client               = client;

        this.m_startTime            = Infinity;
        this.m_currentTime          = null;
        this.m_endTime              = -Infinity;

        this.m_shutdownFlag         = false;
        this.m_doneCacheRequesting  = false;
        this.m_isCacheRequesting    = false;

        this.m_cacheProperties      = null;
        this.m_lastPublishedRequest = 0;

        this.m_numRequestsToPublish = 0;
        this.m_numRequestsPublished = 0;
    };


    solace.PubSubTools.CachePubMonitor.prototype.configurePublish = function (cacheProperties, numRequestsToPublish) {
        this.m_cacheProperties = cacheProperties.clone();
        this.m_numRequestsPublished = 0;
        this.m_numRequestsToPublish = numRequestsToPublish;
        this.m_doneCacheRequesting = false;
    };


    solace.PubSubTools.CachePubMonitor.prototype.isCacheRequesting = function () {
        return this.m_isCacheRequesting;
    };


    solace.PubSubTools.CachePubMonitor.prototype.doneCacheRequesting = function () {
        return this.m_doneCacheRequesting;
    };


    solace.PubSubTools.CachePubMonitor.prototype.stopCacheRequesting = function () {
        this.m_endTime = (new Date()).getTime();
        this.m_doneCacheRequesting = true;
        this.m_isCacheRequesting = false;
        clearInterval(this.m_timerId);
        this.m_timerId = null;
    };


    solace.PubSubTools.CachePubMonitor.prototype.getMonitor = function () {

        var i;
        var lastPub;
        var currentTime;
        var elapsedTime;
        var pubEnd;
        var topic;

        // For requesting at rate, the following are fixed parameters.
        var subscribe = false;
        var liveDataAction = solace.CacheLiveDataAction.FLOW_THRU;

        var self = this;

        return function () {

            // Make sure we will be allowed to publish before trying.
            if (self.m_client.m_pubCongestion === true ||
                self.m_client.m_isConnected === false ) {
                return;
            }

            currentTime = (new Date()).getTime();

            elapsedTime = currentTime - self.m_startTime;

            // Determine how many messages we should have published by now.
            pubEnd = Math.min(Math.floor(self.m_cacheProperties.cacheRequestRate * (elapsedTime / 1000)), self.m_cacheProperties.cacheRequestNumber);

            // Publish messages based on calculation
            for (lastPub = self.m_numRequestsPublished; lastPub < pubEnd; ++lastPub) {
                topic = [self.m_cacheProperties.topicsList[lastPub % self.m_cacheProperties.topicsList.length]];

                try {

                    self.m_client.cacheRequest(
                        topic,
                        subscribe,
                        liveDataAction);

                } catch (error) {

                    if (error.name === "OperationError" &&
                        error.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {
                        // We didn't have enough space to publish.  Try again later.
                        self.m_client.m_pubCongestion = true;
                        break;
                    } else {
                        if (self.m_client.m_session.getSessionState !== solace.SessionState.CONNECTED) {
                            self.m_client.disconnect();
                        }
                        solace.PubSubTools.log.error(error.toString());
                    }
                }
                self.m_client.m_cacheRequestId++;
            }

            self.m_numRequestsPublished = lastPub;

            if (self.m_numRequestsPublished === self.m_numRequestsToPublish) {
                self.m_endTime = (new Date()).getTime();
                self.m_doneCacheRequesting = true;
                self.m_isCacheRequesting = false;
                clearInterval(self.m_timerId);
            }
        };
    };

    solace.PubSubTools.CachePubMonitor.prototype.run = function (startDelay) {

        var self = this;

        if (this.m_timerId !== null) {
            throw new solace.PubSubTools.PubSubError("Attempt to start already started cache pub monitor");
        }

        setTimeout( function () {
            self.m_startTime = (new Date()).getTime();
            self.m_isCacheRequesting = true;
            self.m_timerId = setInterval(self.getMonitor(), self.m_timerInterval);
        }, startDelay || 0);

    };


}.apply(solace.PubSubTools));