// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {


    solace.PubSubTools.PubMonitor = function PubMonitor(client) {

        this.m_timerId              = null;
        this.m_timerInterval        = 25;

        this.m_client               = client;

        this.m_startTime            = Infinity;
        this.m_currentTime          = null;
        this.m_endTime              = -Infinity;

        this.m_shutdownFlag         = false;
        this.m_donePublishing       = false;

        this.m_publishProperties    = null;
        this.m_msgPropsList         = [];
        this.m_lastPublishedMessage = 0;

        this.m_numMsgsToPublish     = 0;
        this.m_numMsgsPublished     = 0;
    };
    

    solace.PubSubTools.PubMonitor.prototype.configurePublish = function (msgsToPublish, publishProps, numMsgsToPublish) {
        var i;

        this.m_msgPropsList = [];

        for (i = 0; i < msgsToPublish.length; ++i) {
            this.m_msgPropsList.push(msgsToPublish[i].clone());
        }

        this.m_publishProperties = publishProps.clone();
        this.m_numMsgsToPublish = numMsgsToPublish;

        this.m_client.updatePublishProps(this.m_publishProperties);

        this.m_lastPublishedMessage = 0;
        this.m_numMsgsPublished = 0;
        this.m_donePublishing = false;
    };


    solace.PubSubTools.PubMonitor.prototype.isPublishing = function () {
        return this.m_isPublishing;
    };


    solace.PubSubTools.PubMonitor.prototype.donePublishing = function () {
        return this.m_donePublishing;
    };


    solace.PubSubTools.PubMonitor.prototype.stopPublishing = function () {
        this.m_endTime = (new Date()).getTime();
        this.m_donePublishing = true;
        this.m_isPublishing = false;
        clearInterval(this.m_timerId);
        this.m_timerId = null;
    };


    solace.PubSubTools.PubMonitor.prototype.getMonitor = function () {

        var lastPub;
        var currentTime;
        var elapsedTime;
        var pubEnd;
        var msgProps;

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
            pubEnd = self.m_numMsgsToPublish;
            if (parseFloat(self.m_publishProperties.messageRate, 10) !== 0) {
                pubEnd = Math.min(Math.floor(self.m_publishProperties.messageRate * (elapsedTime / 1000)), self.m_numMsgsToPublish);
            }

            // Publish messages based on calculation
            for (lastPub = self.m_numMsgsPublished; lastPub < pubEnd; ++lastPub) {

                msgProps = self.m_msgPropsList[lastPub % self.m_msgPropsList.length];

                try {

                    self.m_client.updateToolData(msgProps, lastPub + 1);
                    self.m_client.publishMessage(msgProps);

                } catch (error) {

                    if (error.name === "OperationError" &&
                            error.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {
                       // We didn't have enough space to publish.  Try again later.
                        self.m_client.m_pubCongestion = true;
                        break;
                    } else {
                        solace.PubSubTools.log.error(error.toString());
                    }
                }
            }

            self.m_numMsgsPublished = lastPub;

            if (self.m_numMsgsPublished === self.m_numMsgsToPublish) {
                self.m_endTime = (new Date()).getTime();
                self.m_donePublishing = true;
                self.m_isPublishing = false;
                clearInterval(self.m_timerId);
            }
        };
    };

    solace.PubSubTools.PubMonitor.prototype.run = function (startDelay) {

        var self = this;

        if (this.m_timerId !== null) {
            throw new solace.PubSubTools.PubSubError("Attempt to start already started pub monitor");
        }

        setTimeout( function () {
            self.m_startTime = (new Date()).getTime();
            self.m_isPublishing = true;
            self.m_timerId = setInterval(self.getMonitor(), self.m_timerInterval);
        }, startDelay || 0);

    };


}.apply(solace.PubSubTools));