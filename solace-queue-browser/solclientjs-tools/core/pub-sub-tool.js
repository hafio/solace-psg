// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

	solace.PubSubTools.AsyncExecResponse = function (rc, infoStr) {
		this.rc         = rc;
		this.infoStr    = infoStr;
	};

	solace.PubSubTools.instance = (function () {

		var clients = null;

		return {
			getClients: function() {
				return clients;
			},

			cacheRequest: function (topics, subscribe, liveDataAction, waitForConfirm, minSeq, maxSeq, clientIndex, callback) {
				var liveDataActionValue;

				// If we are getting liveDataAction from selenium, it will be in the form of a string.
				if (typeof(solace.PubSubTools.CacheLiveDataActionSelect[liveDataAction]) !== 'undefined') {
					liveDataActionValue = solace.PubSubTools.CacheLiveDataActionSelect[liveDataAction].value;
				} else {
					liveDataActionValue = liveDataAction;
				}

				clients.cacheRequest(
					topics,
					subscribe,
					liveDataActionValue,
					waitForConfirm,
					minSeq,
					maxSeq,
					clientIndex,
					callback);
			},

			clearKeptMsgs: function () {

			},

			clearLastErrorResponse: function () {

			},

			clearSubscriptionMemory: function () {

			},

			connect: function (callback) {
				clients.connect(callback);
			},

			destroy: function (callback) {
				clients.dispose();
				clients = null;

				// HACK: For now, we will just delay the callback.
				setTimeout(function () {
					if (callback !== undefined) {
						callback({"rc": solace.PubSubTools.asyncResponseRc.OK, "infoStr": "Destroy Completed."});
					}
				}, 1000);
			},

			disconnect: function (callback) {
				clients.disconnect(callback);

				// HACK: For now, we will just delay the callback.
				setTimeout(function () {
					if (callback !== undefined) {
						callback({"rc": solace.PubSubTools.asyncResponseRc.OK, "infoStr": "Disconnect Completed."});
					}                    
				}, 1000);
			},

			getClientName: function (clientIndex) {
				return clients.getClientName(clientIndex);
			},

			getCpuUsage: function () {

			},

			getLastErrorResponse: function () {

			},

			getOutstandingLogs: function () {
				return solace.PubSubTools.log.flush();
			},

			getRtrCapabilities: function () {

			},

			getRxStats: function (clientIndex) {
				if (typeof(clientIndex) === undefined) {
					clientIndex = clients.ALL_CLIENTS_INDEX;
				}
				return clients.getRxStats(clientIndex);
			},

			getSdkStat: function (statType, clientIndex) {
				return clients.getSdkStat(statType, clientIndex);
			},

			getTxStats: function (clientIndex) {
				// The only Tx related stats in PerfStats are related to smooth publishing
				// which isn't implemented yet in javascript, so we will just return a set
				// of empty stats for now.
				if (clientIndex === clients.ALL_CLIENTS_INDEX) {
					clientIndex = "aggregate";
				}
				return (new solace.PubSubTools.PerfStats(clientIndex));
			},

			getTxThroughput: function () {
				return clients.getTxThroughput();
			},

			init: function (properties) {
				var props;

				if (this.isInitialized()) {
					return;
				} else {
					props = new solace.PubSubTools.RuntimeProperties(properties);
					clients = new solace.PubSubTools.PerfClientCollection(props.getClientProperties(),
																		  props.getStatsProperties());
				}
			},

			isInitialized: function () {
				return (clients !== null);
			},

			isConnected: function () {
				return clients.isConnected();
			},

			isPublishing: function () {
				return clients.isPublishing();
			},

			donePublishing: function () {
				return clients.donePublishing();
			},

			publishMessage: function (properties, clientIndex) {
				var props = new solace.PubSubTools.RuntimeProperties(properties);
				clients.publishMessage(props.getPublishProperties(), clientIndex);
			},

			startCacheRequesting: function (properties) {
				var props = new solace.PubSubTools.RuntimeProperties(properties);
				clients.startCacheRequesting(props.getCacheProperties());
			},

			isCacheRequesting: function () {
				return clients.isCacheRequesting();
			},

			doneCacheRequesting: function () {
				return clients.doneCacheRequesting();
			},

			requestReply: function () {

			},

			resetStats: function (clientIndex) {
				clients.resetStats(clientIndex);
			},

			setClientName: function (name, clientIndex) {
				clients.setClientName(name, clientIndex);
			},

			start: function () {

			},

			startPublishing: function (properties) {
				var props = new solace.PubSubTools.RuntimeProperties(properties);
				clients.startPublishing(props.getPublishProperties());
			},

			stop: function () {

			},

			stopPublishing: function () {
				clients.stopPublishing();
			},

			stopCacheRequesting: function () {
				clients.stopCacheRequesting();
			},

			subscriptionUpdate: function (epProps, clientIndex, callback) {

				if (epProps.subscriptions !== undefined) {
					clients.subscriptionUpdate(epProps.subscriptions, epProps.isAdding, clientIndex, callback);
				}
			},

			queueUpdate: function (epProps, clientIndex, callback) {
                if (epProps.subscriptionsQueue !== undefined) {
					clients.queueUpdate(epProps.subscriptionsQueue, epProps.isAdding, epProps.activeFlowInd, epProps.wantReplay, epProps.wantReplayFromDate, 
                            epProps.wantReplayFromMsgId, epProps.flowReconnectAttempts, epProps.flowReconnectIntervalInMsecs, epProps.requiredSettlements, epProps.settlementPattern, epProps.wantMRCS, clientIndex, callback);
				}
			},

			topicUpdate: function(epProps, clientIndex, callback) {
				if (epProps.subscriptionsDtes !== undefined) {
					var topicsList			= epProps.subscriptionsDtes;
					var endpointList		= epProps.subscriptions;
					var isAdding			= epProps.isAdding;
					var unsubscribeTopic	= !(epProps.noSubscriptionRemove);
					var activeFlowInd		= epProps.activeFlowInd;
					var wantReplay			= epProps.wantReplay;
					var wantReplayFromDate	= epProps.wantReplayFromDate;
                    var wantReplayFromMsgId = epProps.wantReplayFromMsgId;
                    var flowReconnectAttempts        = epProps.flowReconnectAttempts;
                    var flowReconnectIntervalInMsecs = epProps.flowReconnectIntervalInMsecs;
					var requiredSettlements          = epProps.requiredSettlements;
					var settlementPatterns           = epProps.settlementPatterns;
					var wantMRCS                     = epProps.wantMRCS;
					
					clients.topicUpdate(topicsList, endpointList, isAdding, unsubscribeTopic, activeFlowInd, wantReplay, wantReplayFromDate, 
							wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, 
							wantMRCS, clientIndex, callback);
				}
			},

			tempTopicUpdate: function(epProps, clientIndex, callback) {
				var isTe = true;
				var numEps = epProps.numEps;
				var endpointList = epProps.endpointList;
				var selectorsList = null;
				var maxMsgSize = epProps.maxMsgSize;
				var quota = epProps.quota;
				var epPermission = epProps.epPermission;
				var respectTTL = epProps.respectTTL;
				var noLocal = epProps.noLocal;
				var activeFlowInd = epProps.activeFlowInd;
				var discardNotifySender = epProps.discardNotifySender;
				var maxMsgRedelivery = epProps.maxMsgRedelivery;
				var sessionName = epProps.sessionName;
				var accessType = epProps.accessType;
				var wantReplay = epProps.wantReplay;
				var wantReplayFromDate = epProps.wantReplayFromDate;
                var wantReplayFromMsgId = epProps.wantReplayFromMsgId;
                var flowReconnectAttempts        = epProps.flowReconnectAttempts;
                var flowReconnectIntervalInMsecs = epProps.flowReconnectIntervalInMsecs;
				var requiredSettlements          = epProps.requiredSettlements;
				var settlementPatterns           = epProps.settlementPatterns;

				clients.tempEndpointUpdate(isTe,numEps,endpointList,selectorsList, maxMsgSize, quota, epPermission, respectTTL, noLocal, 
					activeFlowInd, discardNotifySender, maxMsgRedelivery, sessionName, clientIndex, accessType, wantReplay, wantReplayFromDate, 
                    wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, callback);
			},

			tempQueueUpdate: function(epProps, clientIndex, callback) {
				var isTe = false;
				var numEps = epProps.numEps;
				var endpointList = epProps.endpointList;
				var selectorsList = null;
				var maxMsgSize = epProps.maxMsgSize;
				var quota = epProps.quota;
				var epPermission = epProps.epPermission;
				var respectTTL = epProps.respectTTL;
				var noLocal = epProps.noLocal;
				var activeFlowInd = epProps.activeFlowInd;
				var discardNotifySender = epProps.discardNotifySender;
				var maxMsgRedelivery = epProps.maxMsgRedelivery;
				var sessionName = epProps.sessionName;
				var accessType = epProps.accessType;
				var wantReplay = epProps.wantReplay;
				var wantReplayFromDate = epProps.wantReplayFromDate;
                var wantReplayFromMsgId = epProps.wantReplayFromMsgId;
                var flowReconnectAttempts        = epProps.flowReconnectAttempts;
                var flowReconnectIntervalInMsecs = epProps.flowReconnectIntervalInMsecs;
				var requiredSettlements          = epProps.requiredSettlements;
				var settlementPatterns           = epProps.settlementPatterns;
				
				clients.tempEndpointUpdate(isTe,numEps,endpointList,selectorsList, maxMsgSize, quota, epPermission, respectTTL, noLocal, 
					activeFlowInd, discardNotifySender, maxMsgRedelivery, sessionName, clientIndex, accessType, wantReplay, wantReplayFromDate, 
					wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, callback);
			},

			unbindAllTempEndpoints: function(callback) {
				var ALL_CLIENTS_INDEX = -1;
				clients.unbindAllTempEndpoints(ALL_CLIENTS_INDEX, callback);
			},

			endpointProvisioning: function (epProps, clientIndex, callback) {
				clients.endpointProvisioning(clientIndex, epProps.endpointList, epProps.isTe, epProps.accessType, 
												epProps.maxMsgSize, epProps.quota, epProps.epPermission, epProps.respectTTL, 
												epProps.discardNotifySender, epProps.maxMsgRedelivery, epProps.isAdding, callback);
			},

			mapTopics: function(queue, topicsArray, isAdding, clientIndex, callback) {
				clients.mapTopics(queue, topicsArray, isAdding, clientIndex, callback);
			},

			// We provide specific APIs for stats that are used by our common UI.  This allows us
			// to generalize calls between different web messaging SDKs from the UI.

			getTxTotalDataMsgs: function (clientIndex) {
				return clients.getSdkStat("TX_TOTAL_DATA_MSGS", clientIndex);
			},

			getRxTotalDataMsgs: function (clientIndex) {
				return clients.getSdkStat("RX_TOTAL_DATA_MSGS", clientIndex);
			},

			getRxDiscardMsgIndication: function (clientIndex) {
				return clients.getSdkStat("RX_DISCARD_MSG_INDICATION", clientIndex);
			},

			getClientCount: function () {
				return clients.m_clientList.length;
			},

			getRxThroughput: function () {
				return clients.getRxStats().getThroughput(solace.PubSubTools.perfStatType.numMsgsRecv);
			},

			getCacheResponseDiscards: function () {
				return clients.getSdkStat("CACHE_REQUEST_FULFILL_DISCARD_RESPONSE");
			},

			getClientIdStr: function (clientIndex) {
				return clients.m_clientList[clientIndex].clientIdStr;
			},

			toString: function () {
				if (clients !== null) {
					return clients.toString();
				}
			}
		};
	}());

}.apply(solace.PubSubTools));
