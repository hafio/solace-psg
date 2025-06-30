// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    solace.PubSubTools.SingleStreamOrderCheckingData = function () {

        this.lostMessageIds                 = [];
        this.duplicateMessageIds            = [];
        this.oooMessageIds                  = [];
        this.redeliveredDuplicateMessageIds = [];

        this.previousMessageId              = -1;
    };


    solace.PubSubTools.SingleStreamOrderCheckingData.prototype.aggregate = function (input) {
        this.lostMessageIds = this.lostMessageIds.concat(input.lostMessageIds);
        this.duplicateMessageIds = this.duplicateMessageIds.concat(input.duplicateMessageIds);
        this.oooMessageIds = this.oooMessageIds.concat(input.oooMessageIds);
        this.redeliveredDuplicateMessageIds = this.redeliveredDuplicateMessageIds.concat(input.redeliveredDuplicateMessageIds);
    };


    solace.PubSubTools.SingleStreamOrderCheckingData.prototype.clone = function () {
        
        var ret = new solace.PubSubTools.SingleStreamOrderCheckingData();

        ret.lostMessageIds                  = this.lostMessageIds.slice();
        ret.duplicateMessageIds             = this.duplicateMessageIds.slice();
        ret.oooMessageIds                   = this.oooMessageIds.slice();
        ret.redeliveredDuplicateMessageIds  = this.redeliveredDuplicateMessageIds.slice();

        ret.previousMessageId               = this.previousMessageId;

        return ret;
    };


    /**
     * @class
     * Calculates tool specific client stats such as num messages received, latency, etc.
     */
    solace.PubSubTools.PerfStats = function PerfStats (clientIdStr) {

        var key;

        this.DEFAULT_STREAM_ID              = -1;

        this.clientIdStr                    = clientIdStr;
        this.stats                          = {};
        this.oooData                        = {};
        this.orderMemory                    = [];
        this.repGrpMsgOOODetection          = {};

        this.receiveStartTime = -Infinity;
        this.receiveEndTime   = 0;

        // Initialize all stats to zero (0).
        for (key in solace.PubSubTools.perfStatType) {
            if (solace.PubSubTools.perfStatType.hasOwnProperty(key)) {
                this.stats[solace.PubSubTools.perfStatType[key]] = 0;
            }
        }
    };


    solace.PubSubTools.PerfStats.prototype.getStat = function (statType) {
        return this.stats[statType];
    };


    solace.PubSubTools.PerfStats.prototype.incStat = function (statType, value) {
        this.stats[statType] += value;
    };


    solace.PubSubTools.PerfStats.prototype.incStatWithTime = function (statType, value, timeReceived) {
        this.stats[statType] += value;

        this.updateTimeReceived(timeReceived);
    };


    solace.PubSubTools.PerfStats.prototype.resetStats = function () {
        var key;

        for (key in solace.PubSubTools.perfStatType) {
            if (solace.PubSubTools.perfStatType.hasOwnProperty(key)) {
                this.stats[solace.PubSubTools.perfStatType[key]] = 0;
            }
        }

        this.oooData          = {};
        this.orderMemory      = [];
        this.repGrpMsgOOODetection = {};


        this.receiveStartTime = -Infinity;
        this.receiveEndTime   = 0;
    };

    solace.PubSubTools.PerfStats.prototype.getReplicationGroupMessageOOODetectionList = function (key) {
        return this.repGrpMsgOOODetection[key];
    };

    solace.PubSubTools.PerfStats.prototype.updateReplicationGroupMessageOOODetection = function (key, idToAdd, index, incOOO, incSuidChange) {
        if (this.repGrpMsgOOODetection.size === 0 || this.repGrpMsgOOODetection[key] === undefined) {
            this.repGrpMsgOOODetection[key] = [idToAdd];
            return;
        }
        if (!(incOOO || incSuidChange)) {
            this.repGrpMsgOOODetection[key][index] = idToAdd;
        }
        if (incOOO) {
            this.incStat(solace.PubSubTools.perfStatType.numRepGrpMsgIdDuplicates, 1);
        }
        if (incSuidChange) {
            this.incStat(solace.PubSubTools.perfStatType.numRepGrpMsgIdSpoolChanges, 1);
            this.repGrpMsgOOODetection[key].push(idToAdd);
        }
    };

    solace.PubSubTools.PerfStats.prototype.updateTimeReceived = function (timeReceived) {

        this.receiveEndTime = timeReceived;

        // Must transfer num message to throughput messages when endtime is updated.
        this.stats[solace.PubSubTools.perfStatType.numTputMsgs] = this.stats[solace.PubSubTools.perfStatType.numMsgsRecv];

        if (this.receiveStartTime === -Infinity) {
            this.receiveStartTime = timeReceived;
        }
    };


    solace.PubSubTools.PerfStats.prototype.getThroughput = function (statType) {
        var result;
        var startTime = this.receiveStartTime;

        if (startTime >= this.receiveEndTime) {
            result = 0;
        } else {
            result = this.stats[statType] * 1000 / (this.receiveEndTime - startTime);
        }

        return result;
    };


    solace.PubSubTools.PerfStats.prototype.getDefaultStreamId = function () {
        return this.DEFAULT_STREAM_ID;
    };


    solace.PubSubTools.PerfStats.prototype.getOrderData = function (streamId) {
        return this.oooData[streamId];
    };


    solace.PubSubTools.PerfStats.prototype.checkOrder = function (streamId, messageId, isRedelivered) {

        var index, id;

        var rcOrderOk = true;

        var oooData = this.getOrderData(streamId);

        // If we have a streamId then check order based on the stream.  By default if the
        // message does not have any stream ID in it then the ToolData returns -1.  So we'll
        // use this to indicate the default stream for common processing.
        if (typeof(oooData) !== 'undefined') {
            rcOrderOk = this.checkStreamOrder(oooData, messageId, isRedelivered);
        } else {
            // This must be the first message on this stream, so just initialize order checking
            // for the stream.
            oooData = new solace.PubSubTools.SingleStreamOrderCheckingData();
            oooData.previousMessageId = messageId;
            this.oooData[streamId] = oooData;
        }

        return rcOrderOk;
    };



    solace.PubSubTools.PerfStats.prototype.checkStreamOrder = function (orderData, messageId, isRedelivered) {

        var index, id;

        var rcOrderOk = true;

        var previousMessageId = orderData.previousMessageId;

        if (messageId !== (previousMessageId + 1)) {

            rcOrderOk = false;

            if (messageId < previousMessageId) {

                index = orderData.lostMessageIds.indexOf(messageId);

                if (index === -1) {
                    if (isRedelivered === true) {
                        orderData.redeliveredDuplicateMessageIds.push(messageId);
                    } else {
                        orderData.duplicateMessageIds.push(messageId);
                    }
                    orderData.oooMessageIds.push({messageId: messageId, previousMessageId: previousMessageId});
                } else {
                    orderData.lostMessageIds.splice(index, 1);
                    orderData.oooMessageIds.push({messageId: messageId, previousMessageId: previousMessageId});
                }

            } else if (messageId > (previousMessageId + 1)) {

                // Protect against tool misuse by not blindly running out of memory if suddenly
                // millions of messages are missing.  We'll error in this case.
                if (messageId - previousMessageId > 10000) {
                    solace.PubSubTools.log.warn("STATS " + this.clientIdStr + ": Error during lost msg check.  > 10000 msgs lost.");
                    solace.PubSubTools.log.warn("    Current msg ID: " + previousMessageId + " Next msg ID received: " + messageId);
                } else {
                    for (id = (previousMessageId + 1); id < messageId; ++id) {
                        orderData.lostMessageIds.push(id);
                    }
                }

                orderData.previousMessageId = messageId;

            } else if (messageId === previousMessageId) {

                if (isRedelivered === true) {
                    orderData.redeliveredDuplicateMessageIds.push(messageId);
                } else {
                    orderData.duplicateMessageIds.push(messageId);
                }

                // Don't increment expected message id.
            }
        } else {
            // In order message received so update previous message id.
            orderData.previousMessageId++;
        }

        return rcOrderOk;
    };


    solace.PubSubTools.PerfStats.prototype.aggregate = function (inputStats) {

        var i, key;

        if (this.receiveStartTime > inputStats.receiveStartTime ||
                this.receiveStartTime === -Infinity) {
            this.receiveStartTime = inputStats.receiveStartTime;
        }

        if (this.receiveEndTime < inputStats.receiveEndTime) {
            this.receiveEndTime = inputStats.receiveEndTime;
        }
        
        for (key in solace.PubSubTools.perfStatType) {
            if (solace.PubSubTools.perfStatType.hasOwnProperty(key)) {
                this.stats[solace.PubSubTools.perfStatType[key]] += inputStats.stats[solace.PubSubTools.perfStatType[key]];
            }
        }

        // Note: Aggregating this information does not really make sense.  However
        // it has one use.  The automation can use this to tell if there has been a
        // problem but looking at the aggregate stats and seeing if any of the vectors
        // has size > 0.  So for this we will aggregate the info here.  No one should
        // actually use this info to track down miss ordered messages since they won't
        // know what subscriber it was on.

        // Order checking
        for (key in inputStats.oooData) {
            if (inputStats.oooData.hasOwnProperty(key)) {
                if (this.oooData[key] === undefined) {
                    this.oooData[key] = inputStats.oooData[key].clone();
                } else {
                    this.oooData[key].aggregate(inputStats.oooData[key]);
                }
            }
        }

        return true;
    };

    solace.PubSubTools.PerfStats.prototype.toString = function () {
        var buf = new solace.StringBuffer();
        buf.append("\n");
        for (var key in solace.PubSubTools.perfStatType) {
            if (solace.PubSubTools.perfStatType.hasOwnProperty(key)) {
                buf.append(key + " : " + this.stats[solace.PubSubTools.perfStatType[key]] + "\n");
            }
        }
        return buf.toString();
    };

}.apply(solace.PubSubTools));
