// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

(function() {

    solace.PubSubTools.webEngine = (function () {

        var self = this;

        var state = {
            READY:                  0,
            CONNECT_CLIENTS:        1,
            ADD_SUBSCRIPTIONS:      2,
            START_PUBLISHERS:       3,
            PUBLISHING:             4,
            DONE_PUBLISHING:        5,
            REMOVE_SUBSCRIPTIONS:   6,
            DISCONNECT_CLIENTS:     7,
            CLEANUP:                8
        };

        var stateTimeout = {
            CONNECT_CLIENTS:        180000,
            START_PUBLISHERS:       180000
        };

        var initialState    = state.READY;
        var currentState    = initialState;
        var prevState       = initialState;
        var nextState       = initialState;

        var stopRequested   = false;
        var isRunning       = false;

        var timerId         = null;
        var timerInterval   = 500;
        var currentTimeout  = 0;

        // Rate outputs are given for the trailing 5 seconds.
        var numRatePoints   = parseInt(5000 / timerInterval, 10);
        var pubRatePoints   = {position: 0, data: []};
        var subRatePoints   = {position: 0, data: []};

        var startTime       = 0;

        var scrollLocks     = {
            "log-scroll-lock":        false,
            "messages-scroll-lock":   false
        };


        var subscriptionUpdate = function (isAdding) {
            var clientIndex;
            var topics;
            var queues; 
            var dtes;   
            var epProperties = {isAdding: isAdding};
            var subscriptionTopicLists = solace.PubSubTools.webProperties.getSubscriptionTopicLists();
            var subscriptionQueueLists = solace.PubSubTools.webProperties.getSubscriptionQueueLists(); 
            var subscriptionDteLists   = solace.PubSubTools.webProperties.getSubscriptionDteLists(); 
            var subscriptionTteCount = solace.PubSubTools.webProperties.getTemporaryTopicEndpoints();
            var subscriptionTqeCount = solace.PubSubTools.webProperties.getTemporaryQueueEndpoints();

            var minSeq, maxSeq;

            if (subscriptionTqeCount!==undefined && subscriptionTqeCount!==null && subscriptionTqeCount>0) {
                // Temp queues will get cleaned up automatically on disconnect but don't want to fall through if/else block below
                if(isAdding) {
                    if(solace.PubSubTools.webProperties.getProperty("temporaryQueueEndpoints")!==undefined) {
                        epProperties.numEps = solace.PubSubTools.webProperties.getProperty("temporaryQueueEndpoints");      // -tqe
                    }
                    if(solace.PubSubTools.webProperties.getProperty("subscribeQueueList")!==undefined) {
                        epProperties.endpointList = solace.PubSubTools.webProperties.getProperty("subscribeQueueList");     // -sql
                    }
                    epProperties = populateEpProps(epProperties);

                    for (clientIndex = 0; clientIndex < solace.PubSubTools.webProperties.getProperty("clientNum"); ++clientIndex) {
                        (function (idx) {
                            solace.PubSubTools.instance.tempQueueUpdate(epProperties, idx, function() {
                                var x;
                                var endpoints = solace.PubSubTools.instance.getClients().m_clientList[idx].m_retTempEndpointNames;
                                for (x = 0; x < endpoints.length; x++) {
                                    if (isAdding && subscriptionTopicLists.length > 0) {
                                        solace.PubSubTools.instance.mapTopics(endpoints[x], subscriptionTopicLists[idx % subscriptionTopicLists.length], isAdding, idx);
                                    }
                                }
                            });
                        })(clientIndex);
                    }
                }
            } else if (subscriptionTteCount!==undefined && subscriptionTteCount!==null && subscriptionTteCount>0) {
                // Temp endpoints will get cleaned up automatically on disconnect but don't want to fall through if/else block below
                if (isAdding) {
                    if(solace.PubSubTools.webProperties.getProperty("temporaryTopicEndpoints")!==undefined) {
                        epProperties.numEps = solace.PubSubTools.webProperties.getProperty("temporaryTopicEndpoints");      // -tte
                    }

                    if(solace.PubSubTools.webProperties.getProperty("subscribeTopicList")!==undefined) {
                        epProperties.endpointList = solace.PubSubTools.webProperties.getProperty("subscribeTopicList");     // -stl
                    }
                    epProperties = populateEpProps(epProperties);

                    for (clientIndex = 0; clientIndex < solace.PubSubTools.webProperties.getProperty("clientNum"); ++clientIndex) {
                        solace.PubSubTools.instance.tempTopicUpdate(epProperties, clientIndex);
                    }
                }
            } else if (subscriptionQueueLists.length !== 0) {
                epProperties.activeFlowInd = solace.PubSubTools.webProperties.getProperty("activeFlowInd");
                epProperties.wantReplay = solace.PubSubTools.webProperties.getProperty("wantReplay");
                epProperties.wantReplayFromDate = solace.PubSubTools.webProperties.getProperty("wantReplayFromDate");
                epProperties.wantReplayFromMsgId = solace.PubSubTools.webProperties.getProperty("wantReplayFromMsgId");
                epProperties.flowReconnectAttempts = solace.PubSubTools.webProperties.getProperty("flowReconnectAttempts");
                epProperties.flowReconnectIntervalInMsecs = solace.PubSubTools.webProperties.getProperty("flowReconnectIntervalInMsecs");
                epProperties.wantMRCS = solace.PubSubTools.webProperties.getProperty("wantMRCS");
                for (clientIndex = 0; clientIndex < solace.PubSubTools.webProperties.getProperty("clientNum"); ++clientIndex) {
                    queues = subscriptionQueueLists[clientIndex % subscriptionQueueLists.length];

                    if (queues.length !== 0) {
                        // Call to map topics happens at different times depending on isAdding
                        //   if isAdding is false then remove subscriptions before unbind
                        //   if isAdding is true then add subscriptions after the bind
                        if (isAdding) {
                            (function (idx, queueList) {
                                var mapTopicsCallback = function() {
                                    var x;
                                    if (subscriptionTopicLists.length > 0) {
                                        for (x = 0; x < queueList.length; x++) {
                                            solace.PubSubTools.instance.mapTopics(queueList[x], subscriptionTopicLists[idx % subscriptionTopicLists.length], isAdding, idx);
                                        }
                                    }
                                };
    
                                epProperties.isTe = false;
                                epProperties = populateEpProps(epProperties);
                                if ((solace.PubSubTools.webProperties.getProperty("wantProvision") !== undefined && solace.PubSubTools.webProperties.getProperty("wantProvision"))) {
                                    epProperties.endpointList = queueList;
                                    solace.PubSubTools.instance.endpointProvisioning(epProperties, idx);
                                }
                                epProperties.subscriptionsQueue =  queueList;
                                solace.PubSubTools.instance.queueUpdate(epProperties, idx, mapTopicsCallback);
                            })(clientIndex, queues);
                        } else {
                            if (subscriptionTopicLists.length > 0) {
                                for (i = 0; i < queues.length; ++i) {
                                    solace.PubSubTools.instance.mapTopics(queues[i], subscriptionTopicLists[clientIndex % subscriptionTopicLists.length], isAdding, clientIndex);
                                }
                            }
                            epProperties.isTe = false;
                            epProperties = populateEpProps(epProperties);
                            epProperties.subscriptionsQueue =  queues;
                            solace.PubSubTools.instance.queueUpdate(epProperties, clientIndex);
                            if ((solace.PubSubTools.webProperties.getProperty("wantProvision") !== undefined && solace.PubSubTools.webProperties.getProperty("wantProvision"))) {
                                epProperties.endpointList = queues;
                                solace.PubSubTools.instance.endpointProvisioning(epProperties, clientIndex);
                            }
                        }
                    }
                }
            } else if (subscriptionTopicLists.length !== 0 && subscriptionDteLists.length !== 0) {
				epProperties.activeFlowInd = solace.PubSubTools.webProperties.getProperty("activeFlowInd");
				epProperties.noSubscriptionRemove = solace.PubSubTools.webProperties.getProperty("noSubscriptionRemove");
                epProperties.wantReplay = solace.PubSubTools.webProperties.getProperty("wantReplay");
                epProperties.wantReplayFromDate = solace.PubSubTools.webProperties.getProperty("wantReplayFromDate");
                epProperties.wantReplayFromMsgId = solace.PubSubTools.webProperties.getProperty("wantReplayFromMsgId");
                epProperties.flowReconnectAttempts = solace.PubSubTools.webProperties.getProperty("flowReconnectAttempts");
                epProperties.flowReconnectIntervalInMsecs = solace.PubSubTools.webProperties.getProperty("flowReconnectIntervalInMsecs");
                epProperties.wantMRCS = solace.PubSubTools.webProperties.getProperty("wantMRCS");
                for (clientIndex = 0; clientIndex < solace.PubSubTools.webProperties.getProperty("clientNum"); ++clientIndex) {

					topics = subscriptionTopicLists[clientIndex % subscriptionTopicLists.length];
                    dtes = subscriptionDteLists[clientIndex % subscriptionDteLists.length];

                    if (dtes.length !== 0) {
                        epProperties.isTe = true;
                        epProperties = populateEpProps(epProperties);
                        epProperties.endpointList = dtes;
                        epProperties.subscriptions =  topics;
                        epProperties.subscriptionsDtes =  dtes;
                        // Call to endpointProvisioning happens at different times depending on isAdding
                        if (isAdding) {
                            if ((solace.PubSubTools.webProperties.getProperty("wantProvision")!==undefined && solace.PubSubTools.webProperties.getProperty("wantProvision"))) {
                                solace.PubSubTools.instance.endpointProvisioning(epProperties, clientIndex);
                            }
                            solace.PubSubTools.instance.topicUpdate(epProperties, clientIndex);
                        } else {
                            solace.PubSubTools.instance.topicUpdate(epProperties, clientIndex);
                            if ((solace.PubSubTools.webProperties.getProperty("wantProvision")!==undefined && solace.PubSubTools.webProperties.getProperty("wantProvision"))) {
                                solace.PubSubTools.instance.endpointProvisioning(epProperties, clientIndex);
                            }
                        }
                    }
                }
            } else if (subscriptionTopicLists.length !== 0 ) { 

                for (clientIndex = 0; clientIndex < solace.PubSubTools.webProperties.getProperty("clientNum"); ++clientIndex) {

                    topics = subscriptionTopicLists[clientIndex % subscriptionTopicLists.length];

                    if (topics.length !== 0) {

                        if (solace.PubSubTools.webProperties.getProperty("cacheWantRequestOnSubscribe") === true  &&
                            isAdding) {

                            // Sequence numbers are not supported in cache request and subscriber from cli.  So disable them.
                            minSeq = -1;
                            maxSeq = -1;

                            // cacheRequest(topics, subscribe, liveDataAction, waitForConfirm, minSeq, maxSeq, clientIndex)
                            solace.PubSubTools.instance.cacheRequest(
                                topics,
                                true,
                                solace.PubSubTools.webProperties.getProperty("cacheLiveDataAction"),
                                true,
                                minSeq,
                                maxSeq,
                                clientIndex);

                        } else {

                            epProperties.subscriptions =  topics;
                            solace.PubSubTools.instance.subscriptionUpdate(epProperties, clientIndex);
                        }
                    }
                }
            }

            function populateEpProps(epp) {
                var selectorsList = null;                                                                      // Currently unsupported

                if(solace.PubSubTools.webProperties.getProperty("maxMessageSize")!==undefined) {
                    epp.maxMsgSize = solace.PubSubTools.webProperties.getProperty("maxMessageSize");           // -pem int
                }

                if(solace.PubSubTools.webProperties.getProperty("quota")!==undefined) {
                    epp.quota = solace.PubSubTools.webProperties.getProperty("quota");                         // -peq int
                }

                if(solace.PubSubTools.webProperties.getProperty("permission")!==undefined) {                   // -pep char 'n', 'r', 'c', 'm', 'd'
                    epp.epPermission = solace.PubSubTools.webProperties.getProperty("permission");
                }
                
                if(solace.PubSubTools.webProperties.getProperty("respectTTL")!==undefined) {
                    epp.respectTTL = solace.PubSubTools.webProperties.getProperty("respectTTL");                        // -per
                }

                if(solace.PubSubTools.webProperties.getProperty("wantNoLocal")!==undefined) {
                    epp.noLocal = solace.PubSubTools.webProperties.getProperty("wantNoLocal");                              // -cnl ??
                }

                if(solace.PubSubTools.webProperties.getProperty("activeFlowInd")!==undefined) {
                    epp.activeFlowInd = solace.PubSubTools.webProperties.getProperty("activeFlowInd");                  // -afi ??
                }

                if(solace.PubSubTools.webProperties.getProperty("discardNotifySender")!==undefined) {
                    epp.discardNotifySender = solace.PubSubTools.webProperties.getProperty("discardNotifySender");      // -pedn "default","on" or "off"
                }

                if(solace.PubSubTools.webProperties.getProperty("maxMessageRedelivery")!==undefined) {
                    epp.maxMsgRedelivery = solace.PubSubTools.webProperties.getProperty("maxMessageRedelivery");        // -pemr
                }

                if(solace.PubSubTools.webProperties.getProperty("sessionName")!==undefined) {
                    epp.sessionName = undefined;                                                                        // -scn string ??
                }

                if(solace.PubSubTools.webProperties.getProperty("accessType")!==undefined) {                            // -pea
                    epp.accessType = solace.PubSubTools.webProperties.getProperty("accessType");
                }

                epp.wantReplay = solace.PubSubTools.webProperties.getProperty("wantReplay");
                epp.wantReplayFromDate = solace.PubSubTools.webProperties.getProperty("wantReplayFromDate");
                epp.wantReplayFromMsgId = solace.PubSubTools.webProperties.getProperty("wantReplayFromMsgId");

                // if(solace.PubSubTools.webProperties.getProperty("activeFlowInd")!==undefined) {
                //     epp.activeFlowInd = solace.PubSubTools.webProperties.getProperty("activeFlowInd");
                //     solace.log.debug("activeFlowInd="+epp.activeFlowInd);
                // }

                // Don't need to do this because these values are set in the client object's properties

                // if(solace.PubSubTools.webProperties.getProperty("wantClientAck")!==undefined) {                         // -ca boolean
                //     epp.acknowledgeMode = solace.PubSubTools.webProperties.getProperty("wantClientAck");
                // }

                // if(solace.PubSubTools.webProperties.getProperty("subscribeAckThresh")!==undefined) {                    // awt int 1-75
                //     epp.acknowledgeThreshold = solace.PubSubTools.webProperties.getProperty("subscribeAckThresh");
                // }

                // if(solace.PubSubTools.webProperties.getProperty("subscribeAckTime")!==undefined) {                    // asa int 0-1500
                //     epp.acknowledgeThreshold = solace.PubSubTools.webProperties.getProperty("subscribeAckTime");
                // }

                // if(solace.PubSubTools.webProperties.getProperty("subscribeWindow")!==undefined) {                    // asw int 0-255
                //     epp.acknowledgeThreshold = solace.PubSubTools.webProperties.getProperty("subscribeWindow");
                // }
                
                epp.flowReconnectAttempts = solace.PubSubTools.webProperties.getProperty("flowReconnectAttempts");    // -frc 
                epp.flowReconnectIntervalInMsecs = solace.PubSubTools.webProperties.getProperty("flowReconnectIntervalInMsecs");    // -fri
                
                return epp;
            }

        };


        var updateInstantStats = function () {

            var pubRate;
            var subRate;

            var pubNum;
            var subNum;

            var progress;

            // The rate is calculated using a 5 sec sample.
            var updateRate = function (rateDataPoints, msgCount) {

                var messages;
                var time;

                var oldRateDataPoint;
                var rateDataPoint;

                if (typeof(msgCount) !== 'number') {
                    msgCount = 0;
                }

                rateDataPoint = {
                    time:       (new Date()).getTime(),
                    msgCount:   msgCount
                };

                if (rateDataPoints.data.length < numRatePoints) {
                    rateDataPoints.data[rateDataPoints.position] = rateDataPoint;
                    oldRateDataPoint = rateDataPoints.data[0];
                } else {
                    oldRateDataPoint = rateDataPoints.data[rateDataPoints.position];
                    rateDataPoints.data[rateDataPoints.position] = rateDataPoint;
                }

                rateDataPoints.position = (rateDataPoints.position + 1) % numRatePoints;

                messages = rateDataPoint.msgCount - oldRateDataPoint.msgCount;
                time = rateDataPoint.time - oldRateDataPoint.time;

                return (messages * 1000 / time) || 0;
            };

            pubNum  = solace.PubSubTools.instance.getTxTotalDataMsgs();
            subNum  = solace.PubSubTools.instance.getRxStats().stats[solace.PubSubTools.perfStatType.numMsgsRecv];
            pubRate = updateRate(pubRatePoints, pubNum);
            subRate = updateRate(subRatePoints, subNum);

            solace.PubSubTools.utils.setLabelText("stats-traffic-summary", "- PUB " + pubNum + " @ " + pubRate.toFixed(2) + "mps - SUB " + subNum + " @ " + subRate.toFixed(2) + "mps");

            progress = pubNum / solace.PubSubTools.webProperties.getProperty("messageNum") * 100;

            // If the number of messages to publish (messageNum) is 0, then our progress calculation
            // returns NaN.  In this case, we will set the progress to 100% to indicate that publishing
            // has completed.
            solace.PubSubTools.utils.setProgress(isNaN(progress) ? 100 : progress);
        };

        var displayClientStats = function () {

            var i, t, key;
            var output          = [];

            var orderData;
            var streamId;
            var stats;

            var totOooMsgs      = 0;
            var totLostMsgs     = 0;
            var totDupMsgs      = 0;
            var totRedDupMsgs   = 0;

            var rxStats         = solace.PubSubTools.instance.getRxStats();

            var defaultStreamId = -1;

            output.push("");
            output.push("-----------------------------------------------------");
            output.push("Aggregate Msgs Sent Stats (Total # clients: " + solace.PubSubTools.instance.getClientCount() + ")");
            output.push("Total Messages transmitted = " + solace.PubSubTools.instance.getTxTotalDataMsgs());
            output.push("Computed publish rate (msg/sec) = " + solace.PubSubTools.instance.getTxThroughput());
            output.push("");
            output.push("-----------------------------------------------------");
            output.push("Aggregate Msgs Recv Stats (Total # clients: " + solace.PubSubTools.instance.getClientCount() + ")");
            output.push("Total Message received across all subscribers = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsRecv]);
            output.push("Computed subscriber rate (msg/sec across all subscribers) = " + solace.PubSubTools.instance.getRxThroughput().toFixed(2));
            output.push("Messages received with discard indication = " + solace.PubSubTools.instance.getRxDiscardMsgIndication());
            output.push("");

            if (solace.PubSubTools.webProperties.getProperty("messageObjectTypeCheck") !== undefined && solace.PubSubTools.webProperties.getProperty("messageObjectTypeCheck")) {
                output.push("");
                output.push("Message Object Type Checking:");
                output.push("Total Messages OK   : " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsReceivedObjTypeOk]);
                output.push("Total Messages FAIL : " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsReceivedObjTypeFail]);
            }

            if (solace.PubSubTools.webProperties.getProperty("wantOrderCheck") === true) {

                for (i = 0; i < solace.PubSubTools.instance.getClientCount(); ++i) {

                    stats = solace.PubSubTools.instance.getRxStats(i);
                    orderData = stats.oooData;

                    for (streamId in orderData) {
                        if (orderData.hasOwnProperty(streamId)) {
                            totOooMsgs += orderData[streamId].oooMessageIds.length;
                            totLostMsgs += orderData[streamId].lostMessageIds.length;
                            totDupMsgs += orderData[streamId].duplicateMessageIds.length;
                            totRedDupMsgs += orderData[streamId].redeliveredDuplicateMessageIds.length;
                        }
                    }
                }

                output.push("");
                output.push("Message Order Check Summary:");
                output.push("Total Msgs Order Checked        : " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsOrderChecked]);
                output.push("Total Out of Order Msgs         : " + totOooMsgs);
                output.push("Total Missing Msgs              : " + totLostMsgs);
                output.push("Total Duplicate Msgs            : " + totDupMsgs);
                output.push("Total Redelivered Msgs          : " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsRedelivered]);
                output.push("Total Redelivered Duplicate Msgs: " + totRedDupMsgs);
                output.push("Total Replication Group Message Id Duplicate Msgs: " + rxStats.stats[solace.PubSubTools.perfStatType.numRepGrpMsgIdDuplicates]);
                output.push("Total Replication Group Message Spool Id Changes : " + rxStats.stats[solace.PubSubTools.perfStatType.numRepGrpMsgIdSpoolChanges]);
                output.push("");

                if (totOooMsgs > 0 ||
                        totLostMsgs > 0 ||
                        totDupMsgs > 0 ||
                        totRedDupMsgs > 0) {

                    for (i = 0; i < solace.PubSubTools.instance.getClientCount(); ++i) {

                        stats = solace.PubSubTools.instance.getRxStats(i);

                        output.push("Message Order Details Client: " + solace.PubSubTools.instance.getClientIdStr(i));


                        // Topic sequence order checking is not implemented because the javascript doesn't
                        // support Guaranteed Messaging which is where topic sequence numbering is relevant.


                        // Default message stream.
                        if (typeof(stats.oooData[defaultStreamId]) !== 'undefined') {
                            output.push("  Stream: DEFAULT");
                            output.push.apply(output, solace.PubSubTools.utils.oooDataToString(stats.oooData[defaultStreamId]).split("\n"));
                        }

                        // Non-Default message streams.
                        orderData = stats.oooData;

                        for (streamId in orderData) {
                            if (orderData.hasOwnProperty(streamId)) {

                                streamId = parseInt(streamId, 10);

                                if (streamId === defaultStreamId) {
                                    continue;
                                }
                                output.push("  Stream: " + streamId);
                                output.push.apply(output, solace.PubSubTools.utils.oooDataToString(orderData[streamId]).split("\n"));
                            }
                        }
                    }
                }
            }

            if (solace.PubSubTools.webProperties.getProperty("wantCrcCheck") === true) {
                output.push("");
                output.push("Message Integrity Checking:");
                output.push("Total Messages with OK           = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcOk]);
                output.push("Total Messages with ERRORS       = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcFail]);
                output.push("Msgs with xml payload OK         = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcXmlPayloadOk]);
                output.push("Msgs with xml payload ERRORS     = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcXmlPayloadFail]);
                output.push("Msgs with attachment OK          = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcBinAttachOk]);
                output.push("Msgs with attachment ERRORS      = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcBinAttachFail]);
                output.push("Message with userdata OK         = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcUdOk]);
                output.push("Message with userdata ERRORS     = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcUdFail]);
                output.push("Msgs with structured data OK     = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcSdmOk]);
                output.push("Msgs with structured data ERRORS = " + rxStats.stats[solace.PubSubTools.perfStatType.numMsgsCrcSdmFail]);
            }

            if (solace.PubSubTools.webProperties.getProperty("cacheName") !== "") {
                output.push("");
                output.push("Cache Stats:");
                output.push("Num Requests Sent           = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheReqSent]);
                output.push("Num Responses Recv          = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheRespRecv]);
                output.push("Num Requests Completed OK   = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheReqOk]);
                output.push("Num Requests Incomp No Data = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheReqIncompNoData]);
                output.push("Num Requests Incomp Suspect = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheReqIncompSuspect]);
                output.push("Num Requests Incomp Timeout = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheReqIncompTimeout]);
                output.push("Num Requests Errored        = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheReqError]);
                output.push("Num Live Data Msgs Recv     = " + rxStats.stats[solace.PubSubTools.perfStatType.numLiveMsgsRecv]);
                output.push("Num Cached Data Msgs Recv   = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheMsgsRecv]);
                output.push("Num Msgs Recv Suspect       = " + rxStats.stats[solace.PubSubTools.perfStatType.numCacheSuspectRecv]);
                output.push("Num Resp Discarded          = " + solace.PubSubTools.instance.getCacheResponseDiscards());

            }
            
            if (solace.PubSubTools.webProperties.getProperty("wantPrioStats")||
                solace.PubSubTools.webProperties.getProperty("msgPriorityList")||
                solace.PubSubTools.webProperties.getProperty("msgPriorityFlat")) {
                output.push("");
                output.push("Message Priority statistics:");
                output.push("  Published:");
                for (var i = 0; i < 10; i++) {
                    var prioKey = "numMsgsPriSent"+i;
                    output.push("    Priority#"+i+": "+rxStats.stats[solace.PubSubTools.perfStatType[prioKey]]);
                }
                output.push("    Priority Other: "+rxStats.stats[solace.PubSubTools.perfStatType.numMsgsPriMore]);
                output.push("  Received:");
                for (var i = 0; i < 10; i++) {
                    var prioKey = "numMsgsPri"+i;
                    output.push("    Priority#"+i+": "+rxStats.stats[solace.PubSubTools.perfStatType[prioKey]]);
                }
                output.push("    Priority Other: "+rxStats.stats[solace.PubSubTools.perfStatType.numMsgsPriMore]);
            }

            if (solace.PubSubTools.webProperties.getProperty("settlementPattern") !== "" || solace.PubSubTools.webProperties.getProperty("requiredSettlements") !== "") {
                output.push("");
                output.push("AD Sub ACK/NACK stats: ");
                output.push("Messages Received Accepted = " + solace.PubSubTools.instance.getSdkStat("RX_SETTLE_ACCEPTED", -1));
                output.push("Messages Received Rejected = " + solace.PubSubTools.instance.getSdkStat("RX_SETTLE_REJECTED", -1));
                output.push("Messages Received Failed   = " + solace.PubSubTools.instance.getSdkStat("RX_SETTLE_FAILED", -1));
            }

            if (solace.PubSubTools.webProperties.getProperty("wantVerbose") === true) {
                output.push("");
                output.push(solace.PubSubTools.instance.toString());
                output.push("");
                output.push(solace.PubSubTools.instance.getRxStats().toString());    
            }

            output.push("");
            output.push("Execution completed.");
            output.push("");

            for (i = 0; i < output.length; ++i) {
                solace.PubSubTools.log.out(output[i]);
            }
        };

        var monitor = function () {

            prevState = currentState;
            currentState = nextState;

            currentTimeout -= timerInterval;

            if (solace.PubSubTools.instance.isInitialized() &&
                    currentState >= state.START_PUBLISHERS &&
                    currentState <= state.REMOVE_SUBSCRIPTIONS) {
                updateInstantStats();
            }

            switch(currentState) {

                case state.READY:

                    try {
                        pubRatePoints = {position: 0, data: []};
                        subRatePoints = {position: 0, data: []};

                        solace.PubSubTools.instance.init(solace.PubSubTools.webProperties.getState(true));
                        solace.PubSubTools.instance.connect();

                        currentTimeout = stateTimeout.CONNECT_CLIENTS;
                        nextState = state.CONNECT_CLIENTS;

                    } catch (eReady) {
                        solace.PubSubTools.log.warn("Failed while creating clients");
                        solace.PubSubTools.log.warn(eReady.toString());

                        nextState = state.CLEANUP;
                    }
                    break;

                case state.CONNECT_CLIENTS:

                    try {
                        if (stopRequested) {
                            nextState = state.CLEANUP;
                        } else if (currentTimeout <= 0) {
                            nextState = state.CLEANUP;
                        } else if (solace.PubSubTools.instance.isConnected()) {
                            nextState = state.ADD_SUBSCRIPTIONS;
                        }
                    } catch (eConnectClients) {
                        solace.PubSubTools.log.warn("Failed while waiting for clients to connect");
                        solace.PubSubTools.log.warn(eConnectClients.toString());
                        nextState = state.DISCONNECT_CLIENTS;
                    }
                    break;

                case state.ADD_SUBSCRIPTIONS:

                    try {
                        subscriptionUpdate(true);

                        startTime = (new Date()).getTime();

                        currentTimeout = stateTimeout.START_PUBLISHERS;
                        nextState = state.START_PUBLISHERS;

                    } catch (eAddSubscriptions) {
                        solace.PubSubTools.log.warn("Failed while adding subscriptions");
                        solace.PubSubTools.log.warn(eAddSubscriptions.toString());
                        nextState = state.DISCONNECT_CLIENTS;
                    }
                    break;

                case state.START_PUBLISHERS:

                    try {
                        if ((solace.PubSubTools.webProperties.getProperty("messageNum") === 0 &&
                            solace.PubSubTools.webProperties.getProperty("cacheRequestNumber") === 0) ||
                            stopRequested) {
                            nextState = state.PUBLISHING;
                        } else if (currentTimeout <= 0) {
                                nextState = state.DISCONNECT_CLIENTS;
                        } else {
                            if (prevState !== state.START_PUBLISHERS) {

                                solace.PubSubTools.instance.startPublishing(solace.PubSubTools.webProperties.getState(true));

                                solace.PubSubTools.instance.startCacheRequesting(solace.PubSubTools.webProperties.getState(true));

                            } else if (solace.PubSubTools.instance.donePublishing() && solace.PubSubTools.instance.doneCacheRequesting()) {
                                nextState = state.DONE_PUBLISHING;
                                currentTimeout = 1000 * solace.PubSubTools.webProperties.getProperty("publishEndDelay");
                            } else if (solace.PubSubTools.instance.isPublishing() || solace.PubSubTools.instance.isCacheRequesting()) {
                                nextState = state.PUBLISHING;
                            }

                        }
                    } catch (eStartPublishers) {
                        solace.PubSubTools.log.warn("Failed while starting publishers");
                        solace.PubSubTools.log.warn(eStartPublishers.toString());
                        nextState = state.DISCONNECT_CLIENTS;
                    }
                    break;

                case state.PUBLISHING:

                    try {
                        if ((solace.PubSubTools.webProperties.getProperty("messageNum") === 0 &&
                                solace.PubSubTools.webProperties.getProperty("cacheRequestNumber") === 0) ||
                            (solace.PubSubTools.instance.donePublishing() &&
                                solace.PubSubTools.instance.doneCacheRequesting()) ||
                            stopRequested) {

                            nextState = state.DONE_PUBLISHING;
                        }
                    } catch (ePublishing) {
                        solace.PubSubTools.log.warn("Failed while publishing");
                        solace.PubSubTools.log.warn(ePublishing.toString());
                        nextState = state.DISCONNECT_CLIENTS;
                    }
                    break;

                case state.DONE_PUBLISHING:

                    try {
                        if (solace.PubSubTools.webProperties.getProperty("messageNum") > 0 ||
                            solace.PubSubTools.webProperties.getProperty("cacheRequestNumber") > 0 ||
                            stopRequested) {

                            if (solace.PubSubTools.instance.isPublishing()) {
                                solace.PubSubTools.instance.stopPublishing()
                            }
                            if (solace.PubSubTools.instance.isCacheRequesting()) {
                                solace.PubSubTools.instance.stopCacheRequesting()
                            }

                            nextState = state.REMOVE_SUBSCRIPTIONS;
                            currentTimeout = 1000 * solace.PubSubTools.webProperties.getProperty("publishEndDelay");
                            solace.PubSubTools.log.out("Allow clients to finish receiving.  Waiting: " + (currentTimeout/1000) + " seconds");
                        } else {
                            nextState = state.DONE_PUBLISHING;
                        }
                    } catch (eDonePublishing) {
                        solace.PubSubTools.log.warn(eDonePublishing.toString());
                        nextState = state.DISCONNECT_CLIENTS;
                    }
                    break;

                case state.REMOVE_SUBSCRIPTIONS:
					
					if( solace.PubSubTools.webProperties.getProperty("noSubscriptionRemove") ) {
						solace.PubSubTools.log.info("Option -nsr was true so skipping subscription removal");
						nextState = state.DISCONNECT_CLIENTS;
					} else {				
						try {
							if (currentTimeout > 0) {
								nextState = state.REMOVE_SUBSCRIPTIONS;
							} else {
								subscriptionUpdate(false);
								solace.PubSubTools.instance.unbindAllTempEndpoints();
								nextState = state.DISCONNECT_CLIENTS;
							}
						} catch (eRemoveSubscriptions) {
							solace.PubSubTools.log.warn(eRemoveSubscriptions.toString());
							nextState = state.DISCONNECT_CLIENTS;
						}
					}
                    break;

                case state.DISCONNECT_CLIENTS:

                    try {
                        solace.PubSubTools.instance.disconnect();
                        nextState = state.CLEANUP;
                    } catch (eDisconnectClients) {
                        solace.PubSubTools.log.warn(eDisconnectClients.toString());
                        nextState = state.CLEANUP;
                    }
                    break;

                case state.CLEANUP:

                    if (timerId !== null) {
                        clearInterval(timerId);
                        timerId = null;
                    }

                    if (solace.PubSubTools.instance.isInitialized()) {
                        displayClientStats();
                        solace.PubSubTools.instance.destroy();
                    }

                    nextState = initialState;
                    solace.PubSubTools.webProperties.enableInputs(true);
                    solace.PubSubTools.utils.setProgress(0);
                    isRunning = false;
                    break;

                default:
                    break;
            }

        };

        return {
            start: function () {

                if (isRunning) {
                    return;
                }

                isRunning = true;

                solace.PubSubTools.log.out("##### START REQUESTED #####");
                solace.PubSubTools.webProperties.enableInputs(false);
                stopRequested = false;

                solace.PubSubTools.webProperties.updateAllProperties();

                solace.PubSubTools.setLogLevel(solace.PubSubTools.webProperties.getProperty("logLevel"));

                if (typeof(solace.PubSubTools.log.setRemoteLogAddress) !== 'undefined') {
                    solace.PubSubTools.log.setRemoteLogAddress(solace.PubSubTools.webProperties.getProperty("remoteLogServer"));
                }

                if (timerId === null) {
                    timerId = setInterval(monitor, timerInterval);
                }

                if (typeof($) !== 'undefined') {
                    $('#tabs').tabs('select', '#tabs-test');
                }
            },
            stop: function () {
                solace.PubSubTools.log.debug("webEngine.stop() unbinding all temp endpoints");
                solace.PubSubTools.log.out("##### STOP REQUESTED #####");
                stopRequested = true;
            },
            reset: function () {
                solace.PubSubTools.webProperties.reset();
                solace.PubSubTools.utils.setLabelText("stats-traffic-summary", "");
                solace.PubSubTools.utils.setText("pub-sub-tools-log", "");
                solace.PubSubTools.utils.setText("pub-sub-tools-messages", "");
                solace.PubSubTools.utils.setText("save-load-textarea", "");
                $('#save-load-link').html(window.location.origin + window.location.pathname + "?");
            },
            getScrollLock: function (fieldId) {
                return scrollLocks[fieldId];
            },
            toggleScrollLock: function (fieldId) {
                var icon;

                scrollLocks[fieldId] = scrollLocks[fieldId] ? false : true;
                icon = scrollLocks[fieldId] ? "ui-icon-locked" : "ui-icon-unlocked";

                $("#" + fieldId).button("option", "icons", {primary: icon});
            },
            clearTextArea: function (fieldId) {
                solace.PubSubTools.utils.setText(fieldId, "");
            },
            saveInputs: function () {
                var state = solace.PubSubTools.webProperties.getState();
                solace.PubSubTools.utils.setText('save-load-textarea', state.toString());
                $('#save-load-link').html("<a href=\"" +
                        window.location.protocol + "//" + window.location.host + window.location.pathname + state.toQueryString() + "\">" +
                        window.location.protocol + "//" + window.location.host + window.location.pathname + state.toQueryString() + "</a>");
            },
            loadInputs: function () {
                var state = new solace.PubSubTools.WebPropertiesState();
                state.fromString($('#save-load-textarea').val());

                solace.PubSubTools.webProperties.reset();
                solace.PubSubTools.webProperties.setState(state);
                $('#save-load-link').html("<a href=\"" +
                        window.location.protocol + "//" + window.location.host + window.location.pathname + state.toQueryString() + "\">" +
                        window.location.protocol + "//" + window.location.host + window.location.pathname + state.toQueryString() + "</a>");
            },
            isRunning: function () {
                return isRunning;
            }
        };

    }());

}.apply(solace.PubSubTools));
