// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true, process:true */
var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

	var WorkQueue = function () {

		var data = [];
		var head = 0;
		var size = 0;

		this.size = function () {
			return size;
		};

		this.isEmpty = function () {
			return (size === 0);
		};

		this.enqueue = function (object) {
			data[data.length] = object;
			size++;
		};

		this.dequeue = function () {

			var object;

			if (size === 0) {
				return undefined;
			}

			// This is where we get our efficiency over a native Array.  Array.shift
			// is a O(n) operation.  Rather than calling 'shift' for every dequeue
			// operation, we wait until our load factor is low enough before reclaiming
			// the array size by taking a slice from the head to the end.

			if (--size < data.length * 0.5) {
				data = data.slice(head);
				head = 0;
			}

			return data[head++];
		};

		this.peek = function (object) {
			return (size > 0 ? data[head] : undefined);
		};
	};

	var CONNECTION_STATES = { CONNECTED: "connected", CONNECTING: "connecting", RECONNECTING: "reconnecting", DISCONNECTED: "disconnected" };

	/**
	 * @class
	 * Represents a single client.
	 */
	solace.PubSubTools.Client = function Client (clientId, clientProperties, statsProperties) {

		var self = this;

		var cacheSessionProperties;

		// Populate epl values
		function epl_Populate ( keyValuePairs ) {
			var jaEplKeyValuePairs = [];
			var saTokens;
			if( typeof(keyValuePairs)==="string"){
				saTokens = keyValuePairs.split(",");
			}else{
				saTokens = keyValuePairs;
			}
			for(var i=0; i<saTokens.length; i++) {
				var sKey = saTokens[i];
				var val = saTokens[i+1];
				if( isNaN(val)===false && val.indexOf(".")!==-1) {
					val = parseFloat(val);
				} else if( isNaN(val)===false && val.indexOf(".")===-1) {
					val = parseInt(val,10); // Base 10
				} else if(typeof(val)==="string" && val.toUpperCase()==="FALSE") {
					val = false;
				} else if(typeof(val)==="string" && val.toUpperCase()==="TRUE") {
					val = true;
				} else if(typeof(val)==="string" && val.startsWith("\"")===false) {
					val = "\""+val+"\"";
				}
					
				var sScript = sKey + "=" + val + ";";
				var jKvp = { "key":sKey, "value":val, "script":sScript };
				i+=1;
				jaEplKeyValuePairs.push( jKvp );
			}
			return jaEplKeyValuePairs;
		}

		function epl_GetKvp_KeyStartsWith (jaEplKeyValuePairs, strPrefix) {
			var jaMatches = [];
			for(var i=0; i<jaEplKeyValuePairs.length; i++) {
				if( jaEplKeyValuePairs[i].key.startsWith(strPrefix)===true ) {
					jaMatches.push( jaEplKeyValuePairs[i] );
				}
			}
			return jaMatches;
		}

		var populateSessionProperties = function () {
			var sessionProperties = new solace.SessionProperties();

			// Parse hostlist
			var saHosts = self.m_clientProperties.url.split(",");
			for(var j=0; j<saHosts.length; j++){
				if(saHosts[j].toLowerCase().startsWith("ws://")===false && saHosts[j].toLowerCase().startsWith("wss://")===false &&
					saHosts[j].toLowerCase().startsWith("tcp://")===false && saHosts[j].toLowerCase().startsWith("tcps://")===false &&
					saHosts[j].toLowerCase().startsWith("http://")===false && saHosts[j].toLowerCase().startsWith("https://")===false){
					saHosts[j] = "ws://" + saHosts[j];
				}
			}
			solace.PubSubTools.log.debug("Client::populateSessionProperties() self="+JSON.stringify(self));
			sessionProperties.url                       = saHosts;

			if (self.m_clientProperties.userName !== '' ||
					(self.m_clientProperties.userName === '' &&
					 self.m_clientProperties.authenticationScheme.toLowerCase().indexOf("cert")===-1) &&
					 self.m_clientProperties.authenticationScheme.toLowerCase().indexOf("oauth2")===-1) {
				sessionProperties.userName          = self.m_clientProperties.generateClientUsername(clientId);
			}

			if (self.m_clientProperties.vpnName !== '') {
				sessionProperties.vpnName           = self.m_clientProperties.vpnName;
			}

			sessionProperties.password                  = self.m_clientProperties.password;
			sessionProperties.applicationDescription    = self.m_clientProperties.applicationDescription;
			sessionProperties.keepAliveIntervalInMsecs  = self.m_clientProperties.keepAliveIntervalInMsecs;
			sessionProperties.keepAliveIntervalsLimit   = self.m_clientProperties.keepAliveIntervalsLimit;
			sessionProperties.reapplySubscriptions      = self.m_clientProperties.reapplySubscriptions;
			sessionProperties.maxWebPayload             = self.m_clientProperties.maxWebPayload;
			sessionProperties.connectTimeoutInMsecs     = self.m_clientProperties.connectTimeoutInMsecs;
			sessionProperties.reconnectRetries          = self.m_clientProperties.reconnectRetryCount;
			sessionProperties.reconnectRetryWaitInMsecs = self.m_clientProperties.reconnectRetryIntervalInMs;
			sessionProperties.readTimeoutInMsecs        = self.m_clientProperties.readTimeoutInMsecs;
			sessionProperties.transportDowngradeTimeoutInMsecs = self.m_clientProperties.transportDowngradeTimeoutInMsecs;
			sessionProperties.sslConnectionDowngradeTo = self.m_clientProperties.sslConnectionDowngradeTo;

			// sessionProperties.publisherProperties.enabled must be true to enable AD
			// If using direct, publisherProperties.enabled can be true or false.
			sessionProperties.publisherProperties.enabled = true;

			if (self.m_clientProperties.publishWindow !== undefined) {
			   sessionProperties.publisherProperties.windowSize = self.m_clientProperties.publishWindow; 
			}
			if (self.m_clientProperties.publishAckTime !== undefined) {
				sessionProperties.publisherProperties.acknowledgeTimeoutInMsecs = self.m_clientProperties.publishAckTime;
			}
			sessionProperties.publisherProperties.acknowledgeMode = self.m_clientProperties.adAckEventMode;
			
			// Handle special case: Authentication scheme valid values :
			//  "basic", "Basic", "BASIC", "solace.AuthenticationScheme.BASIC"
			//  "cert", "Cert", "CERT", "certificate", "Certificate", "CERTIFICATE",
			//  "solace.AuthenticationScheme.CLIENT_CERTIFICATE"
			if(self.m_clientProperties.authenticationScheme.toLowerCase().indexOf("basic")!==-1) {
				sessionProperties.authenticationScheme = solace.AuthenticationScheme.BASIC;
			} else if(self.m_clientProperties.authenticationScheme.toLowerCase().indexOf("cert")!==-1) {
				sessionProperties.authenticationScheme = solace.AuthenticationScheme.CLIENT_CERTIFICATE;
			} else if(self.m_clientProperties.authenticationScheme.toLowerCase().indexOf("oauth2")!==-1) {
				sessionProperties.authenticationScheme = solace.AuthenticationScheme.OAUTH2;
			}

			if (self.m_clientProperties.oauthAccessToken !== undefined && self.m_clientProperties.oauthAccessToken !== '') {
				sessionProperties.accessToken = self.m_clientProperties.oauthAccessToken;
			}
			if (self.m_clientProperties.oauthIssuerId !== undefined && self.m_clientProperties.oauthIssuerId !== '') {
				sessionProperties.issuerIdentifier = self.m_clientProperties.oauthIssuerId;
			}
			if (self.m_clientProperties.oauthIdToken !== undefined && self.m_clientProperties.oauthIdToken !== '') {
				sessionProperties.idToken = self.m_clientProperties.oauthIdToken;
			}
			
			// Handle special case: -sslp and -sslep
			// Option -sslp forces it to use a specific protocol, in this case exclude all other values.
			// Values: "tlsv1,tlsv1.1,tlsv1.2"
			if ((self.m_clientProperties.sslMinProtocolVersion !== undefined && self.m_clientProperties.sslMinProtocolVersion !== "") || 
			(self.m_clientProperties.sslMaxProtocolVersion !== undefined && self.m_clientProperties.sslMaxProtocolVersion !== "")) {
				// The min/max options expect the case-sensitive version of the protocol names (e.g. "TLSv1.2")
				// but all our props use the all lowercase version so we need to capitalize the first 3 letters 
				// of each protocol so the system library will recognize them.
				if (self.m_clientProperties.sslMinProtocolVersion !== undefined && self.m_clientProperties.sslMinProtocolVersion !== "") {
					var minProto = self.m_clientProperties.sslMinProtocolVersion;
					sessionProperties.tlsMinProtocol = minProto[0].toUpperCase() + minProto[1].toUpperCase() + minProto[2].toUpperCase() + minProto.slice(3);
				}
				if (self.m_clientProperties.sslMaxProtocolVersion !== undefined && self.m_clientProperties.sslMaxProtocolVersion !== "") {
					var maxProto = self.m_clientProperties.sslMaxProtocolVersion;
					sessionProperties.tlsMaxProtocol = maxProto[0].toUpperCase() + maxProto[1].toUpperCase() + maxProto[2].toUpperCase() + maxProto.slice(3);
				}
			} else {
				var saExProts = null;
				if((self.m_clientProperties.sslProtocol===solace.PubSubTools.SslProtocolSelect.UNSPECIFIED.value ||
					self.m_clientProperties.sslProtocol==="") &&
				self.m_clientProperties.sslExcludedProtocols!=="") {
					// Normal scenario: exclude
					saExProts = self.m_clientProperties.sslExcludedProtocols.split(",");
				} else if(self.m_clientProperties.sslProtocol!==solace.PubSubTools.SslProtocolSelect.UNSPECIFIED.value &&
						self.m_clientProperties.sslProtocol!=="" &&
						self.m_clientProperties.sslExcludedProtocols==="") {
					// Exclude all but the one in sslProtocol
					solace.PubSubTools.log.warn("Option to set protocol is deprecated and not supported by API. sslProtocol="+
					self.m_clientProperties.sslProtocol+", sslExcludedProtocols="+self.m_clientProperties.sslExcludedProtocols);
					var sFullList = "tlsv1,tlsv1.1,tlsv1.2,tlsv1.3";
					saExProts = sFullList.replace(self.m_clientProperties.sslProtocol.toLowerCase(),"").split(",").filter(Boolean);
				} else if(self.m_clientProperties.sslProtocol!==solace.PubSubTools.SslProtocolSelect.UNSPECIFIED.value &&
						self.m_clientProperties.sslProtocol!=="" &&
						self.m_clientProperties.sslExcludedProtocols!=="") {
					// Possible conflicting parameter values
					if( self.m_clientProperties.sslExcludedProtocols.indexOf(self.m_clientProperties.sslProtocol)!==-1) {
						solace.PubSubTools.log.warn("Options to force SSL protocol and exclude SSL protocol are conflicting. Using exclude list.");
					}
					saExProts = self.m_clientProperties.sslExcludedProtocols.split(",");
				}
				sessionProperties.sslExcludedProtocols = saExProts;
			}

			sessionProperties.sslValidateCertificate = false;
			if( self.m_clientProperties.sslValidateCertificate===true || self.m_clientProperties.sslValidateCertificate==="true" ) {
				sessionProperties.sslValidateCertificate = true;
			}
			
			if(self.m_clientProperties.sslValidateCertificateDate===true || self.m_clientProperties.sslValidateCertificateDate==="true") {
				solace.PubSubTools.log.warn("SSL validate certificate date is not supported");
			}

			sessionProperties.sslCipherSuites = self.m_clientProperties.sslCipherSuites;
			if(self.m_clientProperties.sslTrustStores!==""){
				sessionProperties.sslTrustStores = self.m_clientProperties.sslTrustStores.split(",");
			} else {
				sessionProperties.sslTrustStores = [];
			}
			if(self.m_clientProperties.sslTrustedCommonNameList!==""){
				sessionProperties.sslTrustedCommonNameList = self.m_clientProperties.sslTrustedCommonNameList.split(",");
				if(sessionProperties.sslValidateCertificate !== true){
					solace.PubSubTools.log.warn("SSL Trusted common name list is only valid when sessionProperties.sslValidateCertificate is true");
				}
			} else {
				sessionProperties.sslTrustedCommonNameList = [];
			}
			if(self.m_clientProperties.sslCertificate!=="") {
				sessionProperties.sslCertificate = self.m_clientProperties.sslCertificate;
				if(sessionProperties.authenticationScheme !== solace.AuthenticationScheme.CLIENT_CERTIFICATE){
					solace.PubSubTools.log.warn("SSL Certificate is only valid when sessionProperties.authenticationScheme is 'certificate'");
				}
			}
			if(self.m_clientProperties.sslPrivateKey!=="") {
				sessionProperties.sslPrivateKey = self.m_clientProperties.sslPrivateKey;
				if(sessionProperties.authenticationScheme !== solace.AuthenticationScheme.CLIENT_CERTIFICATE){
					solace.PubSubTools.log.warn("SSL Private key is only valid when sessionProperties.authenticationScheme is 'certificate'");
				}
			}
			if(self.m_clientProperties.sslPrivateKeyPassword!=="") {
				sessionProperties.sslPrivateKeyPassword = self.m_clientProperties.sslPrivateKeyPassword;
				if(sessionProperties.authenticationScheme !== solace.AuthenticationScheme.CLIENT_CERTIFICATE){
					solace.PubSubTools.log.warn("SSL Private key password is only valid when sessionProperties.authenticationScheme is 'certificate'");
				}
			}
			
			//      connectRetryCount, connectTimeoutInMsecs, connectRetryCountPerHost, 
			//      reconnectTimeoutInMsecs, reconnectRetryCountPerHost
			//      sslPfx, sslPfxPassword
			// Get the epl comma seperated string and feed it into the sessionProperties object.
			if(self.m_clientProperties.extraPropsList!==""){
				var jaEplKeyValuePairs = epl_Populate( self.m_clientProperties.extraPropsList );
				var jaEplMatches = epl_GetKvp_KeyStartsWith(jaEplKeyValuePairs, "sessionProperties");
				for(var i=0; i<jaEplMatches.length; i++) {
					// This next line makes JSLint ignore the eval() function.
					/*jslint evil: true, regexp: false*/
					eval( jaEplMatches[i].script );
				}
			}

			if(sessionProperties.sslPfx!==""){
				if(sessionProperties.sslCertificate!=="") {
					solace.PubSubTools.log.warn("SSL Pfx is mutually exclusive to sessionProperties.sslCertificate");
				}
				if(sessionProperties.sslPrivateKey!==""){
					solace.PubSubTools.log.warn("SSL Pfx is mutually exclusive to sessionProperties.sslPrivateKey");
				}
				if(sessionProperties.sslTrustStores!==""){
					solace.PubSubTools.log.warn("SSL Pfx is mutually exclusive to sessionProperties.sslTrustStores");
				}
			}
			
			if (self.m_clientProperties.sendBufferMaxSize > 0) {
				sessionProperties.sendBufferMaxSize     = self.m_clientProperties.sendBufferMaxSize;
			}

			if (self.m_clientProperties.transportProtocol !== solace.PubSubTools.TransportProtocolSelect.UNSPECIFIED.value &&
				self.m_clientProperties.transportProtocol !== "") {
				sessionProperties.transportProtocol = self.m_clientProperties.transportProtocol;
			}

			if (self.m_clientProperties.clientNamePrefix !== "" &&
					self.m_clientProperties.changeClientName !== true) {
				sessionProperties.clientName            = self.m_clientProperties.generateClientName(clientId);
			}

			if (self.m_clientProperties.clientCompressionLevel !== -1) {
				sessionProperties.compressionLevel = self.m_clientProperties.clientCompressionLevel;
			}

			if (self.m_clientProperties.payloadCompressionLevel !== -1) {
				sessionProperties.payloadCompressionLevel = self.m_clientProperties.payloadCompressionLevel;
			}

			return sessionProperties;
		};

		this.m_clientId             = clientId;
		this.m_clientProperties     = clientProperties.clone();
		this.m_publishProperties    = null;
		this.m_rxStatsProperties    = statsProperties.clone();
		this.m_txStatsProperties    = statsProperties.clone();

		this.m_msgCount             = 0;
		this.m_msgPubCount          = 0; 
		this.m_partitionKeyIndex    = 0;
		this.m_timestampInterval    = this.m_rxStatsProperties.subscriberRateInterval;

		this.m_clientIdStr          = this.m_clientProperties.generateClientName(clientId);

		this.m_lastErrorResponse    = null;
		
		this.m_lastMessageDetails   = null;
		this.m_lastMessagesDetails   = null;
		this.m_lastMessagesDetailsQueueDepth = this.m_clientProperties.perMessageDetailsQueueDepth;

		if (this.m_clientProperties.wantPerMessageDetails) {
			this.m_lastMessageDetails   = new solace.PubSubTools.LastMessageDetails();
			this.m_lastMessagesDetails   = [];
		}

		this.m_stats                = new solace.PubSubTools.PerfStats(this.m_clientIdStr);
		
		this.m_sessionProperties    = populateSessionProperties();
		try {
			this.m_session              = solace.SolclientFactory.createSession(this.m_sessionProperties,
												new solace.MessageRxCBInfo(function(session, message)  {
													self.messageEventCb(session, message); }, self),
												new solace.SessionEventCBInfo(function(session, event) {
													self.sessionEventCb(session, event);   }, self));
		} catch (error) {
			this.m_lastErrorResponse = error;
			solace.PubSubTools.log.warn("Session create failed:" + "\n\tSubcode: " + solace.ErrorSubcode.describe(error.subcode) + "\n\tMessage: " + error.message);
		}

		// 'endpointUpdate' event is fired internally in the tool when queueUpdate, topicUpdate, tempEndpointUpdate
		// is successful - (when all the flows are created/removed and up/down for the client)
		if (self.m_clientProperties.eventEmitter !== undefined) {
			this.m_eventEmitter           = new self.m_clientProperties.eventEmitter();
			// Add eventListeners for related events.
			this.m_eventEmitter.on("endpointUpdate", solace.PubSubTools.Client.prototype.eventEmitterCb);
			this.m_eventEmitter.on("mapTopicsOk", solace.PubSubTools.Client.prototype.eventEmitterCb);
			// The callbacks for the events associated with m_eventEmitter are registered in this datastructure.
			this.m_eventEmitter.callbacks = {endpointUpdate:[], mapTopicsOk:[]};
		}
		// Datastructure to keep track of all the flows when created/destroyed.
		this.m_flowTaskList    = [];
		// Datastructure to keep track of all the mapped topic when added/removed.
		this.m_mapTopicsList    = [];

		// Our AFW environment has many tests that make use of Blocking cache requests.  Solclientjs
		// doesn't have a Blocking request, but we can emulate a blocking request as we have done
		// in PerfClientCollection#connect and PerfClientCollection#subscriptionUpdate by keeping
		// track of expected events and invoking a callback upon receipt of all expected events.
		// Clients will notify the PerfClientCollection upon receipt of expected events, but the
		// PerfClientCollection is responsible for keeping track of which events are expected.

		// Notification handling was designed to handle regular session events.  The session events
		// are defined by the API and have numerical values.  To reuse our event notification code
		// while avoiding collisions with regular session events, we will start the cacheRequestId's
		// at 1000.
		this.m_cacheRequestId       = 1000;
		this.m_cacheSession         = null;
		this.m_cacheCbInfo          = new solace.CacheCBInfo(this.cacheRequestEventCb, this);

		this.m_isConnected          = false;
		this.m_connectionState      = CONNECTION_STATES.DISCONNECTED;
		this.m_clientName           = null;

		this.m_pubMsg               = solace.SolclientFactory.createMessage();
		this.m_pubCongestion        = false;

		this.m_rxToolData           = new solace.PubSubTools.ToolData();

		this.m_eventCallbacks       = {};


		this.m_wantReplyTopic       = false;

		this.m_wantPublishFlags     = false;

		this.m_SubscriberFlows      = {};   
		this.m_durableQueueConsumers= {};   // key is queueList element
		this.m_dteConsumers         = {};   // key is topicsList element
		this.m_retTempEndpointNames = [];
		
		this.m_flowPropertiesAcknowledgeMode = solace.MessageConsumerAcknowledgeMode.AUTO;

		if (this.m_clientProperties.wantClientAck) {
			this.m_flowPropertiesAcknowledgeMode = solace.MessageConsumerAcknowledgeMode.CLIENT;
		}

		this.m_clientAckSkipNum     = this.m_clientProperties.clientAckSkipNum; 

		this.m_keptMsgQueue         = []; 

		// Work queues are used to handle cases where an INSUFFICIENT_SPACE exception is raised.
		// Actions that could not be completed because of this exception will be scheduled for
		// future execution.  This work will be triggered when a CAN_ACCEPT_DATA event is received.
		// Work queues are processed in priority order based on their order in processWorkQueues().

		this.m_subscriptionWorkQueue = new WorkQueue();
		this.m_cacheRequestWorkQueue = new WorkQueue();
		this.m_queueWorkQueue = new WorkQueue();

		this.m_wantCacheMsgStats = false;

		if (this.m_clientProperties.cacheName !== "") {
			cacheSessionProperties = new solace.CacheSessionProperties(
				this.m_clientProperties.cacheName,
				this.m_clientProperties.cacheMaxAgeInSecs,
				this.m_clientProperties.cacheMaxMessages,
				this.m_clientProperties.cacheTimeoutInMsecs);

			this.m_cacheSession = this.m_session.createCacheSession(cacheSessionProperties);

			this.m_wantCacheMsgStats = true;
		}

		// For better performance, we cache some often needed flags.

		this.m_pubWantToolData      = this.m_txStatsProperties.wantToolData();
		this.m_wantSlowPath         = this.m_rxStatsProperties.wantToolData() ||
			this.m_clientProperties.wantMessageDump ||
			(this.m_clientProperties.clientMode !== solace.PubSubTools.ClientModeSelect.SINK.value) ||
			this.m_wantCacheMsgStats || this.m_clientProperties.wantPrioStats || this.m_clientProperties.wantPerMessageDetails;

	};


	solace.PubSubTools.Client.prototype.processWorkQueues = function () {

		var workItem,
			topic,
			unsubscribeTopic,
			correlationKey,
			requestConfirm,
			requestId,
			wantSubscribe,
			liveDataAction,
			consumer,
			consumerProperties,
			settlementUtil,
			queueDescriptor;

		try {

			// Process the cache request work queue.
			while (this.m_cacheRequestWorkQueue.size() > 0) {

				// We don't want to shift the work item off the queue yet because the work
				// has not been completed.
				workItem = this.m_cacheRequestWorkQueue.peek();

				requestId       = workItem.requestId;
				topic           = workItem.topic;
				wantSubscribe   = workItem.wantSubscribe;
				liveDataAction  = workItem.liveDataAction;

				this.m_cacheSession.sendCacheRequest(
					requestId,
					topic,
					wantSubscribe,
					liveDataAction,
					new solace.CacheCBInfo(this.cacheRequestEventCb, {client: this, requestParams: workItem}));

				// If the operation completed without exception, we can remove the work item
				// from the queue.

				this.m_cacheRequestWorkQueue.dequeue();
			}

			// Process subscription work queue.
			while (this.m_subscriptionWorkQueue.size() > 0) {

				// We don't want to shift the work item off the queue yet because the work
				// has not been completed.
				workItem = this.m_subscriptionWorkQueue.peek();

				requestConfirm      = workItem.requestConfirm;
				correlationKey      = workItem.correlationKey;
				topic               = workItem.topic;
				unsubscribeTopic    = workItem.unsubscribeTopic;
				settlementUtil      = workItem.settlementUtil;

				if (workItem.isProvisioning !== undefined && workItem.isProvisioning) {
					if (workItem.isAdding) {
						// Mirror CCSMP behavior of setting ignoreExists to true.
						this.m_session.provisionEndpoint(workItem.epDesciptor, workItem.queueProperties, true, null);
					} else {
						// The ignoreMissing option is new in JS, we want to keep it 
						// as consistent with the other APIs so force it to false
						this.m_session.deprovisionEndpoint(workItem.epDesciptor, false, null);
					}
				} else {
					if (workItem.isAdding) {
						// We can be adding either a direct messaging topic or a guaranteed messaging
						// consumer.
						if (topic) {
							this.m_session.subscribe(topic, requestConfirm, correlationKey);
						} else {
							consumerProperties = workItem.consumerProps;
							consumer = this.m_session.createMessageConsumer(consumerProperties);
							consumer.connect();
							consumer.ownerClient = this;
							consumer.flowUp = false;
							consumer.afiState = consumerProperties.activeIndicationEnabled;
							consumer.settlementUtil = settlementUtil;
							this.m_flowTaskList.push(consumer);
							if (workItem.consumerSet) {
								workItem.consumerSet[consumerProperties.queueDescriptor.name] =
									consumer;
							}
							this.registerFlowEventHandler(consumer);
							consumer.on(solace.MessageConsumerEventName.MESSAGE,
								solace.PubSubTools.Client.prototype.handleSubscriberFlowMessage);
						}
					} else {
						if (topic) {
							this.m_session.unsubscribe(topic, requestConfirm, correlationKey);
						} else {
							consumer = workItem.consumer;
							consumer.stop();
							if (this.m_clientProperties.wantClientAck) {
								this.clearKeptMsgs(consumer);
							}
							consumer.disconnect();
							if (unsubscribeTopic) {
								// TODO: Should this be done in the consumer's on(DOWN) handler?
								this.m_session.unsubscribeDurableTopicEndpoint(
									consumer.getProperties().queueDescriptor);
							}
							delete this.m_SubscriberFlows[consumer.getProperties().queueDescriptor.name];
						}
					}
				}

				// If the operation completed without exception, we can remove the work item
				// from the queue.
				this.m_subscriptionWorkQueue.dequeue();
			}

			while (this.m_queueWorkQueue.size() > 0) {

				// We don't want to shift the work item off the queue yet because the work
				// has not been completed.
				workItem = this.m_queueWorkQueue.peek();

				if (workItem.isAdding) {
					workItem.consumerObj.addSubscription(workItem.topic, workItem.topic.getName());
				} else {
					workItem.consumerObj.removeSubscription(workItem.topic, workItem.topic.getName());
				}
				// If the operation completed without exception, we add it to the mapTopicsList
				// which will be used to verify all the topics have been mapped before emitting the mapTopicsOk event.
				this.m_mapTopicsList.push(workItem.topic.getName());

				// If the operation completed without exception, we can remove the work item
				// from the queue.
				this.m_queueWorkQueue.dequeue();
			}

			// If there wasn't enough space in the transport to complete all work items, an
			// exception will have been thrown.  As such, if we made it this far, it's because
			// there is no more work to do.
			this.m_pubCongestion = false;

		} catch (error) {
			this.m_lastErrorResponse = error;
			if (error.name === "OperationError" &&
					error.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {

				// We didn't have enough space in our transport.  Work item is left on the queue
				// for next time. 
				this.m_pubCongestion = true;

			} else {
				this.m_lastErrorResponse = error;
				throw new solace.PubSubTools.PubSubError("processWorkQueues failed: " + error.message);
			}
		}
	};

	solace.PubSubTools.Client.prototype.setLastErrorFromSessionEvent = function(event) {
		var error = {};
		if (event !== undefined) {
			error.subcode = event.errorSubcode;
			error.responseCode = event.responseCode;
			error.message = event.infoStr;
		}
		this.m_lastErrorResponse = error;
	};

	solace.PubSubTools.Client.prototype.buildMsg = function (msg, msgProps) {

		var replyToTopic;

		var delMode = null;
		if ((this.m_publishProperties.pubMsgType !== undefined && this.m_publishProperties.pubMsgType.toLowerCase()==="persistent") || this.m_publishProperties.messageDeliveryModeType.toLowerCase()==="persistent") {
			delMode = solace.MessageDeliveryModeType.PERSISTENT;
		} else if ((this.m_publishProperties.pubMsgType !== undefined && this.m_publishProperties.pubMsgType.toLowerCase()==="nonpersistent") || this.m_publishProperties.messageDeliveryModeType.toLowerCase()==="nonpersistent") {
			delMode = solace.MessageDeliveryModeType.NON_PERSISTENT;
		} else {
			delMode = solace.MessageDeliveryModeType.DIRECT;
		}
		msg.setDeliveryMode(delMode);

		if( this.m_msgPubCount % this.m_publishProperties.pubAckImmediatelyInterval === 0 ) {
			msg.setAcknowledgeImmediately(true);
		}
		this.m_msgPubCount += 1;

		if (this.m_pubWantToolData) {
			if (this.m_txStatsProperties.wantUserPropToolData) {
				this.setToolDataAsProperties(msg, msgProps);
			} else {
				this.setToolDataAsAttachment(msgProps);
			}
		}

		if (msgProps.partitionKeyList !== null) {
			var properties = msg.getUserPropertyMap();
			var pk = msgProps.partitionKeyList[this.m_partitionKeyIndex % msgProps.partitionKeyList.length];
			this.m_partitionKeyIndex++;
			if (properties === undefined) {
				var sdtMapContainer = new solace.SDTMapContainer();
				sdtMapContainer.addField(solace.Message.SOLCLIENT_USER_PROP_QUEUE_PARTITION_KEY, solace.SDTFieldType.STRING, pk);
				msg.setUserPropertyMap(sdtMapContainer);
			} else {
				msg.getUserPropertyMap().addField(solace.Message.SOLCLIENT_USER_PROP_QUEUE_PARTITION_KEY, solace.SDTFieldType.STRING, pk);
			}
		}

		if (this.m_publishProperties.httpContentEncoding !== undefined && this.m_publishProperties.httpContentEncoding !== null) {
			msg.setHttpContentEncoding(this.m_publishProperties.httpContentEncoding);
		}
		if (this.m_publishProperties.httpContentType !== undefined && this.m_publishProperties.httpContentType !== null) {
			msg.setHttpContentType(this.m_publishProperties.httpContentType);
		}

		if (msgProps.xmlPayload !== null) {
			msg.setXmlContent(msgProps.xmlPayload);
		}

		if (msgProps.attachment !== null) {
			msg.setBinaryAttachment(msgProps.attachment);
		}

		if (msgProps.topic !== null) {
			msg.setDestination( solace.SolclientFactory.createTopicDestination( msgProps.topic ) );
		} else if (msgProps.queue.startsWith("#P2P/QTMP")) {
			msg.setDestination( new solace.Topic( msgProps.queue ) );
		} else {
			msg.setDestination( solace.SolclientFactory.createDurableQueueDestination( msgProps.queue ) );
		}

		if (this.m_publishProperties.priorityProbabilityArray.length > 0) {
		  var rnd = Math.floor(Math.random() * 100); //const
		  if (rnd <= this.m_publishProperties.priorityProbabilityArray.length) {
			  var prio = this.m_publishProperties.priorityProbabilityArray[rnd];
			  msg.setPriority(prio);
		  } else {
			  msg.setPriority(undefined);
		  }
		}

		if (this.m_wantPublishFlags) {
			if (this.m_publishProperties.deliverToOne) {
				msg.setDeliverToOne(true);
			}
			if (this.m_publishProperties.elidingEligible) {
				msg.setElidingEligible(true);
			}
		}

		if (this.m_publishProperties.publishReplyTopic) {
			replyToTopic = this.m_publishProperties.publishReplyPostfix;

			if (replyToTopic !== "") {
				replyToTopic = msgProps.topic + replyToTopic;
			} else {
				replyToTopic = this.m_session.getSessionProperties().p2pInboxInUse;
			}

			msg.setReplyTo(solace.SolclientFactory.createTopicDestination(replyToTopic));
		}

		if (this.m_publishProperties.classOfService !== solace.PubSubTools.ClassOfServiceSelect.UNSPECIFIED.value) {
			msg.setUserCos(this.m_publishProperties.classOfService);
		}

		if(this.m_publishProperties.deadMessageQueueEligible!==undefined) {
			msg.setDMQEligible( this.m_publishProperties.deadMessageQueueEligible );
		}

		if( this.m_publishProperties.timeToLiveInMsecs!==undefined && 
			this.m_publishProperties.timeToLiveInMsecs!==-1 &&
			isNaN(this.m_publishProperties.timeToLiveInMsecs)===false ) {
			msg.setTimeToLive( this.m_publishProperties.timeToLiveInMsecs );
		}
	};


	solace.PubSubTools.Client.prototype.messageEventCb = function (session, message) {

		this.processMessage(message);

	};

	solace.PubSubTools.Client.prototype.handleSubscriberFlowMessage = function (message) {
		this.ownerClient.processMessage(message);
		if (this.ownerClient.m_clientProperties.wantClientAck) {
			if (this.ownerClient.m_clientAckSkipNum > 0) {
				solace.PubSubTools.log.info("CLIENT " + this.ownerClient.m_clientIdStr + ": Skipping Ack of Msg Id: " + message.getGuaranteedMessageId());
				this.ownerClient.m_clientAckSkipNum--;
				return;
			}
			if (this.ownerClient.m_clientProperties.subMsgQueueDepth > 0) {
				var outcome;
				if (this.settlementUtil !== undefined && this.settlementUtil !== null) {
					outcome = this.settlementUtil.GenNextOutcome();
				}
				this.ownerClient.keepMsg(message, outcome);
			} else {
				if (this.settlementUtil !== undefined && this.settlementUtil !== null) {
					try {
						message.settle(this.settlementUtil.GenNextOutcome());
					} catch (settleError) {
						solace.PubSubTools.log.warn("Failed to settle message: " + settleError.message);
						throw new solace.PubSubTools.PubSubError("Failed to settle message: " + settleError.message);
					}
				} else {
					try {
						message.acknowledge();
					} catch (ackError) {
						solace.PubSubTools.log.warn("Failed to acknowledging message: " + ackError.message);
						throw new solace.PubSubTools.PubSubError("Failed acknowledging message: " + ackError.message);
					}
				}
			}
		}
	};

	solace.PubSubTools.Client.prototype.registerFlowEventHandler = function (flow) {
		var eventList = [
			solace.MessageConsumerEventName.ACTIVE,
			solace.MessageConsumerEventName.CONNECT_FAILED_ERROR,
			solace.MessageConsumerEventName.DISPOSED,
			solace.MessageConsumerEventName.DOWN,
			solace.MessageConsumerEventName.DOWN_ERROR,
			solace.MessageConsumerEventName.GM_DISABLED,
			solace.MessageConsumerEventName.INACTIVE,
			solace.MessageConsumerEventName.UP,
			solace.MessageConsumerEventName.SUBSCRIPTION_OK,
			solace.MessageConsumerEventName.SUBSCRIPTION_ERROR
		];
		var handler;
		var makeHandler = function (eventType) {
			// 'this' pointer inside the eventHandler function points to the eventEmitter(subscriberFlow)
			return function(error) {
				solace.PubSubTools.Client.prototype.flowEventHandler(this, eventType, error);
			};
		};

		for (var i = 0; i < eventList.length; i++) {
			handler = makeHandler(eventList[i]);
			flow.on(eventList[i],handler);
		}
	};

	solace.PubSubTools.Client.prototype.flowEventHandler = function (flow, eventType, error) {
		var logFlowEvent = function () {
			var buf = new solace.StringBuffer();
			var destination;
			try {
				destination = flow.getDestination();
			} catch (ex) {}
			buf.append("CLIENT " + flow.ownerClient.getClientIdStr() + " : " + eventType + " - ");
			buf.append("ConsumerFlowId: " + flow.flowId);
			if (destination !== undefined) {
				buf.append(", Destination: " + destination.toString());
			}
			solace.PubSubTools.log.info(buf.toString());
		};

		var logFlowErrorEvent = function () {
			var buf = new solace.StringBuffer();
			var destination;
			try {
				destination = flow.getDestination();
			} catch (ex) {}
			// Cannot get any flow related properties here
			buf.append("CLIENT " + flow.ownerClient.getClientIdStr() + " : " + eventType);
			buf.append(" - ConsumerFlowId: " + flow.flowId);
			if (destination !== undefined) {
				buf.append(", : " + destination.toString());
			}
			if (error !== undefined) {
				buf.append(" - ErrorSubcode: " + solace.ErrorSubcode.describe(error.subcode));
				buf.append(", ResponseCode: " + error.responseCode);
				buf.append(", Description: " + error.message);
			}
			flow.ownerClient.m_lastErrorResponse = error;
			solace.PubSubTools.log.warn(buf.toString());
			return buf.toString();
		};

		var logSubErrorEvent = function () {
			var buf = new solace.StringBuffer();
			var destination;
			try {
				destination = flow.getDestination();
			} catch (ex) {}
			// Cannot get any flow related properties here
			buf.append("CLIENT " + flow.ownerClient.getClientIdStr() + " : " + eventType);
			if (destination !== undefined) {
				buf.append(" : " + destination.toString());
			}
			if (error !== undefined) {
				buf.append(" - ErrorSubcode: " + solace.ErrorSubcode.describe(error.subcode));
				buf.append(", ResponseCode: " + error.responseCode);
				buf.append(", Description: " + error.infoStr);
			}

			// Massage the error to match the structure expected when returning for AFW
			error.message = error.infoStr;

			flow.ownerClient.m_lastErrorResponse = error;
			solace.PubSubTools.log.warn(buf.toString());
			return buf.toString();
		};
		
		var handleFlowUpDown = function () {

			logFlowEvent();
			// Remove the entry for this flow from m_flowTaskList
			for (var i = 0; i < flow.ownerClient.m_flowTaskList.length; i++) {
				if (flow.ownerClient.m_flowTaskList[i] === flow) {
					flow.ownerClient.m_flowTaskList.splice(i--, 1);
				}
			}
			// Emit endpointUpdate event when m_flowTaskList is empty (i.e. when all flows for this client are up/down)
			if (flow.ownerClient.m_flowTaskList.length === 0 && flow.ownerClient.m_eventEmitter !== undefined) {
				flow.ownerClient.m_eventEmitter.emit(
					"endpointUpdate",
					flow.ownerClient,
					{eventType: "endpointUpdate"});
			}
		};

		var handleSubAddRemove = function () {
			for (var i = 0; i < flow.ownerClient.m_mapTopicsList.length; i++) {
				if (flow.ownerClient.m_mapTopicsList[i] === error.correlationKey) {
					flow.ownerClient.m_mapTopicsList.splice(i--, 1);
					break;
				}
			}
			// Emit mapTopicsOk event when m_mapTopicsList is empty (i.e. when all subs for this flow are added/removed)
			if (flow.ownerClient.m_mapTopicsList.length === 0 && flow.ownerClient.m_eventEmitter !== undefined) {
				flow.ownerClient.m_eventEmitter.emit(
					"mapTopicsOk",
					flow.ownerClient,
					{eventType: "mapTopicsOk"});
			}
		};

		try {
			var endpoint;
			switch (eventType) {
				case solace.MessageConsumerEventName.UP:
					flow.flowUp = true;
					if(flow.getProperties().queueDescriptor.durable===false) {
						flow.ownerClient.m_retTempEndpointNames.push( flow.getProperties().queueDescriptor.name );
					}
					// Add flow to m_SubscriberFlows for the client.
					flow.ownerClient.m_SubscriberFlows[flow.getProperties().queueDescriptor.name] = flow;
					handleFlowUpDown();
					break;

				case solace.MessageConsumerEventName.DOWN:
					flow.flowUp = false;
					handleFlowUpDown();
					break;
	
				case solace.MessageConsumerEventName.CONNECT_FAILED_ERROR:
					var errorString = logFlowErrorEvent();
					// Clear the task list
					flow.ownerClient.m_flowTaskList = [];
					if (flow.ownerClient.m_eventEmitter !== undefined) {
						flow.ownerClient.m_eventEmitter.emit("endpointUpdate",
							flow.ownerClient,
							{ eventType: "endpointUpdate", infoStr: errorString });
					}
					process.emitWarning(errorString);
					break;

				case solace.MessageConsumerEventName.DOWN_ERROR:
					flow.flowUp = false;
					logFlowErrorEvent();
					// Set receivedDownError property for the flow to true.
					flow.ownerClient.m_SubscriberFlows[flow.getProperties().queueDescriptor.name].receivedDownError = true;
					break;

				case solace.MessageConsumerEventName.SUBSCRIPTION_OK:
					handleSubAddRemove();
					break;

				case solace.MessageConsumerEventName.SUBSCRIPTION_ERROR:
					var subErrorString = logSubErrorEvent();
					flow.ownerClient.m_mapTopicsList = [];
					if (flow.ownerClient.m_eventEmitter !== undefined) {
						flow.ownerClient.m_eventEmitter.emit(
							"mapTopicsOk",
							flow.ownerClient,
							{eventType: "mapTopicsOk"});
					}
					process.emitWarning(subErrorString);
					break;

				default:
					logFlowEvent();
					break;
			}
				
		} catch (e) {
			solace.PubSubTools.log.error("Error in flowEventHandler: " + e + "\nStack: " + e.stack);
		}
	};
	
	solace.PubSubTools.Client.prototype.keepMsg = function (message, outcome) {
		// Push message into the queue
		this.m_keptMsgQueue.push({message: message, outcome: outcome});
		// Ack messages when the queue size exceeds the limit specified.
		if (this.m_keptMsgQueue.length > this.m_clientProperties.subMsgQueueDepth) {
			var desiredQueueSize = this.m_clientProperties.subMsgQueueDepth;
			if (this.m_clientProperties.clientAckQueueFlush || 
				this.m_clientProperties.clientAckQueueReverse) {
				desiredQueueSize = 0;
			}
			this.processKeptMsgs(desiredQueueSize,this.m_clientProperties.wantClientAck);
		}
	};

	solace.PubSubTools.Client.prototype.processKeptMsgs = function (desiredQueueSize,isclientAckEnabled) {
		while (this.m_keptMsgQueue.length > desiredQueueSize) {
			var msg = null;
			if (this.m_clientProperties.clientAckRandomDepth > 0) {
				var maxValue = Math.min(this.m_clientProperties.clientAckRandomDepth,this.m_keptMsgQueue.length);
				// Make sure that the random value generated is always a valid index for the keptMsgQueue
				var randomValue = Math.floor(Math.random() * maxValue);
				msg = this.m_keptMsgQueue.splice(randomValue,1);
				msg = msg[0];
			} else if (this.m_clientProperties.clientAckQueueReverse) {
				msg = this.m_keptMsgQueue.pop();
			} else {
				msg = this.m_keptMsgQueue.shift();
			}
			if (isclientAckEnabled) {
				// message.acknowldge() throws solace.OperationError
				if (msg.outcome !== undefined) {
					try {
						msg.message.settle(msg.outcome);
					} catch (settleError) {
						throw new solace.PubSubTools.PubSubError("Failed to settle message: " + settleError.message);
					}
				} else {
					try {
						msg.message.acknowledge();
					} catch (error) {
						throw new solace.PubSubTools.PubSubError("Failed acknowledging message: " + error.message);
					}
				}
			}
		}
	};

	solace.PubSubTools.Client.prototype.clearKeptMsgs = function (consumer) {
		// Start checking the queue from the first item and acknowledge if the destination matches
		this.m_keptMsgQueue = this.m_keptMsgQueue.filter(function(msg) {
			if (msg.message.getMessageConsumer() !== consumer) {
				return true;
			}

			// message.acknowldge() throws solace.OperationError
			try {
				msg.message.acknowledge();
			} catch (error) {
				throw new solace.PubSubTools.PubSubError("Failed acknowledging message: " + error.message);
			}
			return false;
		});
	 };

	solace.PubSubTools.Client.prototype.processMessage = function (message) {

		var timeReceived = 0;
		var attachment = null;

		this.m_msgCount++;

		if (this.m_msgCount % this.m_timestampInterval === 0) {
			// every X messages we take timing
			timeReceived = (new Date()).getTime();
		}

		var span = null;
		if (this.m_clientProperties.traceCopyReceiveContext) {
			try {
				var getter = new solace.solaceW3C.SolaceW3CTextMapGetter();
				var tracer = solace.tracingApi.trace.getTracer('sdkperf_nodejs');
				var parentCtx = solace.tracingApi.propagation.extract(solace.tracingApi.ROOT_CONTEXT, message, getter);
				span = tracer.startSpan(message.getDestination().getName() + ' sdkperf_nodejs_process', {kind: solace.tracingApi.SpanKind.CONSUMER}, parentCtx || undefined);
			} catch (traceError) {
				solace.PubSubTools.log.error("Error creating process span: " + traceError);
			}
		}

		if (this.m_clientProperties.wantStructMsgCheck) {
			// Access the SDT body (if any) to trigger lazy SDT parsing
			message.getSdtContainer();
		}

		if (this.m_clientProperties.messageObjectTypeCheck !== undefined && this.m_clientProperties.messageObjectTypeCheck !== null && this.m_clientProperties.messageObjectTypeCheck) {
			if (message.getApplicationMessageType() !== null) {
				var expectedType = message.getApplicationMessageType();
				var gotCorrectType = false;
				var gotCorrectContent = false;
				if (expectedType.toLowerCase() === "b") {
					if (message.getType() === solace.MessageType.BINARY) {
						gotCorrectType = true;
						if (message.getBinaryAttachment() !== null && message.getBinaryAttachment().toString() === "123") {
							gotCorrectContent = true;
						}
					}
				} else if (expectedType.toLowerCase() === "t") {
					if (message.getType() === solace.MessageType.TEXT) {
						gotCorrectType = true;
						if (message.getSdtContainer() !== null && message.getSdtContainer().getType() === solace.SDTFieldType.STRING && message.getSdtContainer().getValue() === "TEXT_MESSAGE") {
							gotCorrectContent = true;
						}
					}
				} else if (expectedType.toLowerCase() === "m") {
					if (message.getType() === solace.MessageType.MAP) {
						gotCorrectType = true;
						if (message.getSdtContainer() !== null && message.getSdtContainer().getType() === solace.SDTFieldType.MAP && message.getSdtContainer().getValue().getField("MAP").getValue() === "MESSAGE") {
							gotCorrectContent = true;
						}
					}
				} else if (expectedType.toLowerCase() === "s") {
					if (message.getType() === solace.MessageType.STREAM) {
						gotCorrectType = true;
						if (message.getSdtContainer() !== null && message.getSdtContainer().getType() === solace.SDTFieldType.STREAM && message.getSdtContainer().getValue().getNext().getValue() === "STREAM_MESSAGE") {
							gotCorrectContent = true;
						}
					}
				}
				if (gotCorrectType === true && gotCorrectContent === true) {
					this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsReceivedObjTypeOk, 1);
				} else {
					this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsReceivedObjTypeFail, 1);
				}
			}
		}

		if (this.m_wantSlowPath) {
			this.m_rxToolData.reset();

			try {

				if (this.m_rxStatsProperties.wantUserPropToolData) {
					this.readToolDataFromProperties(message);
				} else {
					attachment = message.getBinaryAttachment();
				    if ((attachment !== null) && (attachment !== undefined)) {
						this.m_rxToolData.decode(solace.PubSubTools.utils.strToByteArray(attachment));
					}
				}

			} catch (error) {
				this.m_lastErrorResponse = error;
				solace.PubSubTools.log.error("CLIENT " + this.getClientIdStr() + " : Error decoding tool data.  Cause: " + error);

				// Allow code to continue anyway because tool data will
				// be initialized to 0.
			}
		}

		if (this.m_wantSlowPath) {
			this.processMessageSlowPath(message);
		}

		if (span !== null) {
			span.end();
		}

		// Must update this stat last since AFW often  polls for this.  To avoid race conditions,
		// increment this after all other message processing is done.
		if (timeReceived !== 0) {
			this.m_stats.incStatWithTime(solace.PubSubTools.perfStatType.numMsgsRecv, 1, timeReceived);
		} else {
			this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsRecv, 1);
		}
	};

	solace.PubSubTools.Client.prototype.readToolDataFromProperties = function (message) {

		var properties = message.getUserPropertyMap();

		if (properties !== null) {

			try {
				var xmlPayloadProp = properties.getField(solace.PubSubTools.ToolData.PROP_XML_PAYLOAD_HASH);
				if (xmlPayloadProp !== null && xmlPayloadProp !== undefined) {
					var xmlPayloadHash = xmlPayloadProp.getValue();
					this.m_rxToolData.setCrcXmlPayload(0xffffffff & xmlPayloadHash);
				}
			} catch (xmlPayloadErr) {
				solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + " cannot read xmlPayloadHash property: " + xmlPayloadErr.message);
			}

			try {
				var binPayloadProp = properties.getField(solace.PubSubTools.ToolData.PROP_BIN_PAYLOAD_HASH);
				if (binPayloadProp !== null && binPayloadProp !== undefined) {
					var binPayloadHash = binPayloadProp.getValue();
					this.m_rxToolData.setCrcBinAttach(0xffffffff & binPayloadHash);
				}
			} catch (binPayloadErr) {
				solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + " cannot read binPayloadHash property: " + binPayloadErr.message);
			}

			try {
				var messageIdProp = properties.getField(solace.PubSubTools.ToolData.PROP_MESSAGE_ID);
				if (messageIdProp !== null && messageIdProp !== undefined) {
					var messageId = messageIdProp.getValue();
					this.m_rxToolData.setMessageId(messageId);
				}
			} catch (messageIdErr) {
				solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + " cannot read messageId property: " + messageIdErr.message);
			}

			try {
				var streamIdProp = properties.getField(solace.PubSubTools.ToolData.PROP_STREAM_ID);
				if (streamIdProp !== null && streamIdProp !== undefined) {
					var streamId = streamIdProp.getValue();
					this.m_rxToolData.setStreamId(streamId);
				}
			} catch (streamIdErr) {
				solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + " cannot read streamId property: " + streamIdErr.message);
			}

			try {
				var latencyProp = properties.getField(solace.PubSubTools.ToolData.PROP_LATENCY);
				if (latencyProp !== null && latencyProp !== undefined) {
					var latency = latencyProp.getValue();
					this.m_rxToolData.setLatency(latency);
				}
			} catch (latencyErr) {
				solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + " cannot read latency property: " + latencyErr.message);
			}
		}
	};


	solace.PubSubTools.Client.prototype.processMessageSlowPath = function (message) {

		var i;
		var anyCrcFails    = false;
		var bytes;
		var crc;

		var messageId       = 0;

        if (this.m_rxStatsProperties.wantOrderCheck && message.getReplicationGroupMessageId() !== undefined && !message.isRedelivered()) {
            var currId = message.getReplicationGroupMessageId();
            var incOOO = false;
            var incSuidChange = true;

            var repList = this.m_stats.getReplicationGroupMessageOOODetectionList(this.ownerClient);
            if (repList !== undefined) {
                for (i = 0; i < repList.length; i++) {
                    try {
                        if (repList[i].compare(currId) > 0) {
                            incOOO = true;
                        }
                        incSuidChange = false;
                        break;
                    } catch (ignored) {
                    }
                }
            }
            this.m_stats.updateReplicationGroupMessageOOODetection(this.ownerClient, currId, i, incOOO, incSuidChange);
        }


		if (this.m_rxStatsProperties.wantOrderCheck &&
				this.m_rxToolData.hasMessageId()) {

			messageId = this.m_rxToolData.m_messageId;

			solace.PubSubTools.log.trace("CLIENT " + this.getClientIdStr() + ": Processing message " + messageId);

			if (!this.m_stats.checkOrder(this.m_rxToolData.m_streamId, messageId, message.isRedelivered())) {
				solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + ": Order error detected for msg: " + messageId +
						" (stream: " + this.m_rxToolData.m_streamId + ")");
			}

			this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsOrderChecked, 1);
		}

		if (this.m_rxStatsProperties.wantCrcCheck) {

			if (this.m_rxToolData.hasCrcXmlPayload()) {

				bytes = message.getXmlContent();

				// We do nothing if we get null back here.  No OKs of FAILs.
				if (bytes !== null && bytes.length !== 0) {

					crc = solace.PubSubTools.crc32(bytes);

					if (this.m_rxToolData.getCrcXmlPayload() === crc) {
						this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsCrcXmlPayloadOk, 1);
					} else {
						anyCrcFails = true;
						this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsCrcXmlPayloadFail, 1);
						solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + ": MesssageId: " + messageId +
								", XML payload CRC error.  Received CRC: " + this.m_rxToolData.getCrcXmlPayload() + ", Calculated CRC: " + crc);
					}
				}
			}

			if (this.m_rxToolData.hasCrcBinAttach()) {

				bytes = message.getBinaryAttachment();

				if (bytes !== null && bytes.length !== 0) {

					crc = solace.PubSubTools.crc32(bytes.substring(this.m_rxToolData.getDecodedSize(), bytes.length));

					if (this.m_rxToolData.getCrcBinAttach() === crc) {
						this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsCrcBinAttachOk, 1);
					} else {
						anyCrcFails = true;
						this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsCrcBinAttachFail, 1);
						solace.PubSubTools.log.warn("CLIENT " + this.getClientIdStr() + ": MesssageId: " + messageId +
								", Bin attachment CRC error.  Received CRC: " + this.m_rxToolData.getCrcBinAttach() + ", Calculated CRC: " + crc);
					}
				}
			}

			if (anyCrcFails) {
				this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsCrcFail, 1);
			} else {
				this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsCrcOk, 1);
			}
		}

		if (this.m_wantCacheMsgStats) {

			switch(message.getCacheStatus()) {

				case solace.MessageCacheStatus.LIVE:
					this.m_stats.incStat(solace.PubSubTools.perfStatType.numLiveMsgsRecv, 1);
					break;

				case solace.MessageCacheStatus.CACHED:
					this.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheMsgsRecv, 1);
					break;
				case solace.MessageCacheStatus.SUSPECT:
					this.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheMsgsRecv, 1);
					this.m_stats.incStat(solace.PubSubTools.perfStatType.numSuspectRecv, 1);
					break;
			}
		}
		if (this.m_clientProperties.wantPrioStats) {
			if (message.getPriority() !== undefined) {
				if (message.getPriority() < 10){
				  var prioKey = "numMsgsPri"+message.getPriority();
				  this.m_stats.incStat(solace.PubSubTools.perfStatType[prioKey], 1);
				} else {
				  this.m_stats.incStat(solace.PubSubTools.perfStatType.numMsgsPriMore, 1);
				}
			}
		}

		if (this.m_lastMessageDetails !== null) {
			this.m_lastMessageDetails.clear();

			var dest = message.getDestination();
			if (dest !== undefined && dest !== null) {
				this.m_lastMessageDetails.setDestination(dest.getName());
				this.m_lastMessageDetails.setDestinationType(dest.getType());
			}

			var rtDest = message.getReplyTo();
			if (rtDest !== undefined && rtDest !== null) {
				this.m_lastMessageDetails.setReplyToDestination(rtDest.getName());
				this.m_lastMessageDetails.setReplyToDestinationType(rtDest.getType());
			}

			var httpContentEncoding = message.getHttpContentEncoding();
			if (httpContentEncoding !== undefined && httpContentEncoding !== null) {
				this.m_lastMessageDetails.setHttpContentEncoding(httpContentEncoding);
			}
			var httpContentType = message.getHttpContentType();
			if (httpContentType !== undefined && httpContentType !== null) {
				this.m_lastMessageDetails.setHttpContentType(httpContentType);
			}

			var corrId = message.getCorrelationId();
			if (corrId !== undefined && corrId !== null) {
				this.m_lastMessageDetails.setCorrelationId(corrId);
			}
			var exp = message.getGMExpiration();
			if (exp !== undefined && exp !== null) {
				this.m_lastMessageDetails.setExpiration(exp);
			}
			var appId = message.getApplicationMessageId();
			if (appId !== undefined && appId !== null) {
				this.m_lastMessageDetails.setApplicationMessageId(appId);
			}
			var appType = message.getApplicationMessageType();
			if (appType !== undefined && appType !== null) {
				this.m_lastMessageDetails.setApplicationMessageType(appType);
			}
			var sendTS = message.getSenderTimestamp();
			if (sendTS !== undefined && sendTS !== null) {
				this.m_lastMessageDetails.setSenderTimestamp(sendTS);
			}
			var rgmid = message.getReplicationGroupMessageId();
			if (rgmid !== undefined && rgmid !== null) {
				this.m_lastMessageDetails.setReplicationGroupMsgId(rgmid);
			}
			var mid = message.getGuaranteedMessageId();
			if (mid !== undefined && mid !== null) {
				this.m_lastMessageDetails.setMessageId(mid);
			}

			var deliveryMode = message.getDeliveryMode();
			if (deliveryMode === solace.MessageDeliveryModeType.DIRECT) {
				this.m_lastMessageDetails.setDeliveryMode("DIRECT");
			} else if (deliveryMode === solace.MessageDeliveryModeType.PERSISTENT) {
				this.m_lastMessageDetails.setDeliveryMode("PERSISTENT");
			} else {
				this.m_lastMessageDetails.setDeliveryMode("NON_PERSISTENT");
			}

			var deliveryCount = -1;
			try {
				deliveryCount = message.getDeliveryCount();
			} catch (error) { }
			this.m_lastMessageDetails.setDeliveryCount(deliveryCount);
			
			this.m_lastMessageDetails.setPriority(message.getPriority());
			this.m_lastMessageDetails.setCos(message.getUserCos());
			this.m_lastMessageDetails.setRedelivered(message.isRedelivered());
			this.m_lastMessageDetails.setAckImmediately(message.isAcknowledgeImmediately());
			this.m_lastMessageDetails.setDmqEligible(message.isDMQEligible());

			var binPayload = message.getBinaryAttachment();
			if (binPayload !== undefined && binPayload !== null) {
				this.m_lastMessageDetails.setBinaryPayloadSize(binPayload.length);
			}

			try {
				var creationContext = message.getCreationContext();
				if (creationContext !== undefined && creationContext !== null) {
					this.m_lastMessageDetails.setCreationContextTraceId(creationContext.getTraceId());
					this.m_lastMessageDetails.setCreationContextSpanId(creationContext.getSpanId());
					this.m_lastMessageDetails.setCreationContextSampled(creationContext.getIsSampled());
					this.m_lastMessageDetails.setCreationContextTraceState(creationContext.getTraceState());
				}
			} catch (creationError) { 
				solace.PubSubTools.log.debug("Error getting creation context\n" + creationError);
			}
			try {
				var transportContext = message.getTransportContext();
				if (transportContext !== undefined && transportContext !== null) {
					this.m_lastMessageDetails.setTransportContextTraceId(transportContext.getTraceId());
					this.m_lastMessageDetails.setTransportContextSpanId(transportContext.getSpanId());
					this.m_lastMessageDetails.setTransportContextSampled(transportContext.getIsSampled());
					this.m_lastMessageDetails.setTransportContextTraceState(transportContext.getTraceState());
				}
			} catch (transportError) { 
				solace.PubSubTools.log.debug("Error getting transport context: " + transportError);
			}
			try {
				var baggage = message.getBaggage();
				if (baggage !== undefined && baggage.getBaggage() !== undefined) {
					this.m_lastMessageDetails.setBaggage(baggage.getBaggage());
				}
			} catch (baggageError) { }

			if (this.m_lastMessagesDetails !== null) {
				this.m_lastMessagesDetails.push(this.m_lastMessageDetails.clone());
				if (this.m_lastMessagesDetails.length > this.m_lastMessagesDetailsQueueDepth) {
					this.m_lastMessagesDetails.shift();
				}
			}
		}

		if (this.m_clientProperties.wantMessageDump) {
			solace.PubSubTools.log.message("^^^^^^^^^^^^^^^^^^ Start Message ^^^^^^^^^^^^^^^^^^^^^^^^^^^");

			bytes = message.dump(solace.MessageDumpFlag.MSGDUMP_FULL).split("\n");
			for (i =0; i < bytes.length; ++i) {
				solace.PubSubTools.log.message(bytes[i]);
			}

			if (this.m_rxToolData.hasData()) {
				bytes = this.m_rxToolData.toString().split("\n");
				for (i =0; i < bytes.length; ++i) {
					solace.PubSubTools.log.message(bytes[i]);
				}
			}

			solace.PubSubTools.log.message("^^^^^^^^^^^^^^^^^^ End Message ^^^^^^^^^^^^^^^^^^^^^^^^^^^");
		}

		if (this.m_clientProperties.clientMode === solace.PubSubTools.ClientModeSelect.REPLY.value) {
			this.reflectMessage(message);
		}
	};


	solace.PubSubTools.Client.prototype.reflectMessage = function (message) {

		var dest;

		dest = message.getReplyTo();

		if ( dest === null || dest === undefined ) {
			// No replyTo destination  was set by the sender.
			return;
		} else {
			message.setReplyTo(null);
			message.setAsReplyMessage(true);
			message.setDestination(dest);
			try {
				this.m_session.send(message);
			} catch (error) {
				this.m_lastErrorResponse = error;
				solace.PubSubTools.log.error("CLIENT " + this.m_clientIdStr + ": Error in reflectMessage: " + error.message);
			}
		}
	};


	solace.PubSubTools.Client.prototype.sessionEventCb = function (session, event) {

		var self = this;

		var eventCallback;
		var key;

		switch (event.sessionEventCode) {

			case solace.SessionEventCode.UP_NOTICE:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());

				this.m_isConnected = true;
				this.m_connectionState = CONNECTION_STATES.CONNECTED;

				if (this.m_clientName !== null) {
					this.setClientName(this.m_clientName);
				} else if (this.m_clientProperties.clientNamePrefix !== "" &&
						this.m_clientProperties.changeClientName) {
					this.setClientName(this.m_clientProperties.generateClientName(this.m_clientId));
				}

				break;

			case solace.SessionEventCode.DISCONNECTED:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());

				this.m_pubCongestion = false;

				this.m_isConnected = false;
				this.m_connectionState = CONNECTION_STATES.DISCONNECTED;

				// Dispose of temp flows after disconnect so they will not be re-bound on connect
				for(key in this.m_SubscriberFlows) {
					if(this.m_SubscriberFlows.hasOwnProperty(key)) {
						if( this.m_SubscriberFlows[key].getProperties().queueDescriptor.durable === false ) {
							this.m_SubscriberFlows[key].dispose();
							delete this.m_SubscriberFlows[key];
						}
					}
				}
				break;
			
			case solace.SessionEventCode.RECONNECTING_NOTICE:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				this.m_isConnected = false;
				this.m_connectionState = CONNECTION_STATES.RECONNECTING;
				break;
			
			case solace.SessionEventCode.RECONNECTED_NOTICE:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				this.m_isConnected = true;
				this.m_connectionState = CONNECTION_STATES.CONNECTED;
				// Connecting all the flows(that received solace.MessageConsumerEventName.DOWN_ERROR) for the client
				for(key in this.m_SubscriberFlows) {
					if(this.m_SubscriberFlows.hasOwnProperty(key) && this.m_SubscriberFlows[key].receivedDownError === true){
						solace.PubSubTools.log.debug("CLIENT " + this.m_clientIdStr + ": Binding to " + key);
						this.m_SubscriberFlows[key].connect();
					}
				}
				break;

			case solace.SessionEventCode.CAN_ACCEPT_DATA:
				this.processWorkQueues();
				break;
			
			case solace.SessionEventCode.ACKNOWLEDGED_MESSAGE:
				solace.PubSubTools.log.debug("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				this.m_stats.incStat(solace.PubSubTools.perfStatType.numAckEvents, 1);
				this.m_stats.incStat(solace.PubSubTools.perfStatType.numPubMsgsAcked, 1);
				break;
			case solace.SessionEventCode.REJECTED_MESSAGE_ERROR:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				this.m_stats.incStat(solace.PubSubTools.perfStatType.numNackEvents, 1);
				this.m_stats.incStat(solace.PubSubTools.perfStatType.numPubMsgsAcked, 1);
				this.setLastErrorFromSessionEvent(event);
				break;
			case solace.SessionEventCode.DOWN_ERROR:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				this.m_pubCongestion = false; // Is this needed ?
				this.m_isConnected = false;
				this.m_connectionState = CONNECTION_STATES.DISCONNECTED;
				this.setLastErrorFromSessionEvent(event);
				process.emitWarning(event.toString());
				break;
			case solace.SessionEventCode.CONNECT_FAILED_ERROR:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				process.emitWarning(event.toString());
				break;
			default:
				solace.PubSubTools.log.info("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				break;
		}

		// In our automated testing environment, a perf-client-collection monitors certain
		// client events.  An event watch is added using registerEventCallback(...).

		// When Connect is called we want to return success on UP_NOTICE or failure on CONNECT_FAILED_ERROR
		// so the method listens for CONNECT_EVENT which covers both
		if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE || 
			event.sessionEventCode === solace.SessionEventCode.CONNECT_FAILED_ERROR) {
			if (typeof (this.m_eventCallbacks.CONNECT_EVENT) !== 'undefined') {
				while (this.m_eventCallbacks.CONNECT_EVENT.length > 0) {
					eventCallback = this.m_eventCallbacks.CONNECT_EVENT.pop();
					if (event.sessionEventCode === solace.SessionEventCode.CONNECT_FAILED_ERROR) {
						eventCallback.onFailure("CLIENT " + this.m_clientIdStr + ": " + event.toString());
					} else {
						eventCallback.onSuccess();
					}
				}
			}
		}


		if (typeof (this.m_eventCallbacks[event.sessionEventCode]) !== 'undefined') {
			while (this.m_eventCallbacks[event.sessionEventCode].length > 0) {
				eventCallback = this.m_eventCallbacks[event.sessionEventCode].pop();
				if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_ERROR) {
					eventCallback.onFailure("CLIENT " + this.m_clientIdStr + ": " + event.toString());
				} else {
					eventCallback.onSuccess();
				}
			}
		}
	};

	solace.PubSubTools.Client.prototype.registerEventEmitterEventCb = function (eventType, callback) {

		if (this.m_eventEmitter === undefined) {
			return;
		}
		if (this.m_eventEmitter.callbacks[eventType] === undefined) {
			this.m_eventEmitter.callbacks[eventType] = [];
		}

		// When the specified event is received by the client, it will execute all registered callbacks
		// with their associated arguments.  Once executed, the callback is unregistered.
		this.m_eventEmitter.callbacks[eventType].push(callback);
	};

	solace.PubSubTools.Client.prototype.eventEmitterCb = function (client,event) {
	
		var eventCallback;

		solace.PubSubTools.log.debug("[eventEmitterCb] - Received " + event.eventType);

		if (typeof (this.callbacks[event.eventType]) !== 'undefined') {
			while (this.callbacks[event.eventType].length > 0) {
				eventCallback = this.callbacks[event.eventType].pop();

				if (event.infoStr !== undefined && event.infoStr !== "") {
					eventCallback.onFailure(event.infoStr);
				} else {
					eventCallback.onSuccess();
				}
			}
		}
	};

	solace.PubSubTools.Client.prototype.cacheRequest = function (topics, wantSubscribe, liveDataAction, waitForConfirm) {
		var i;
		var topic;
		var userObject;
		var prevRequestParams = {},
			requestParams,
			firstRequestParams;

		if (this.m_cacheSession === null) {
			throw new solace.PubSubTools.PubSubError("Attempted cacheRequest when cacheSession is null.");
		}

		for (i = 0; i < topics.length; ++i) {
			topic = solace.SolclientFactory.createTopicDestination(topics[i]);

			try {

				requestParams = {
					requestId:      this.m_cacheRequestId,
					topic:          topic,
					wantSubscribe:  wantSubscribe,
					liveDataAction: liveDataAction
				};

				userObject = {
					client:         this,
					requestParams:  requestParams
				};

				if (waitForConfirm) {

					// Don't send the request yet.  We will build up the chain of requests
					// and perform them in order.

					if (i > 0) {
						prevRequestParams.nextRequest = requestParams;
					} else {
						firstRequestParams = requestParams;
					}

				} else {

					this.m_cacheSession.sendCacheRequest(
						this.m_cacheRequestId,
						topic,
						wantSubscribe,
						liveDataAction,
						new solace.CacheCBInfo(this.cacheRequestEventCb, userObject)
					);
				}

			} catch (error) {
				this.m_lastErrorResponse = error;
				if (error.name === "OperationError" &&
					error.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {

					// We didn't have enough space in our transport.  Queue work for later.
					// Work queues are processed upon receipt of a CAN_ACCEPT_DATA event.

					this.m_cacheRequestWorkQueue.enqueue(userObject.requestParams);

				} else {
					throw new solace.PubSubTools.PubSubError("Error in sendCacheRequest failed: " + error.message);
				}
			}
			this.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqSent, 1);
			this.m_cacheRequestId++;

			prevRequestParams = requestParams;
		}

		// With the request chain built, send the first request.
		if (waitForConfirm) {

			userObject = {
				client:         this,
				requestParams:  firstRequestParams
			};

			try {
				this.m_cacheSession.sendCacheRequest(
					firstRequestParams.requestId,
					firstRequestParams.topic,
					firstRequestParams.wantSubscribe,
					firstRequestParams.liveDataAction,
					new solace.CacheCBInfo(this.cacheRequestEventCb, userObject)
				);
			} catch (e) {
				if (e.name === "OperationError" &&
					e.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {

					// We didn't have enough space in our transport.  Queue work for later.
					// Work queues are processed upon receipt of a CAN_ACCEPT_DATA event.

					this.m_cacheRequestWorkQueue.enqueue(firstRequestParams);

				} else {
					throw new solace.PubSubTools.PubSubError("Error in sendCacheRequest failed: " + e.message);
				}
			}
		}

	};


	solace.PubSubTools.Client.prototype.cacheRequestEventCb = function (requestId, cacheRequestResult, userObject) {

		var returnCode = cacheRequestResult.getReturnCode(),
			returnSubcode = cacheRequestResult.getReturnSubcode(),
			error = cacheRequestResult.getError(),
			client = userObject.client,
			nextRequest = userObject.requestParams.nextRequest;

		// This is a special case where the cache request was never sent because there
		// was INSUFFICIENT_SPACE in the transport.  In this case, we don't want to alter
		// any stats.  We want to resend the request once there is room in the transport.
		// Processing of the cacheRequestWorkQueue will be triggered by the receipt of
		// a CAN_ACCEPT_DATA event on the session's event callback.
		if (returnCode === solace.CacheReturnCode.FAIL &&
			returnSubcode === solace.CacheReturnSubcode.ERROR_RESPONSE &&
			error.name === "OperationError" &&
			error.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {

			client.m_cacheRequestWorkQueue.enqueue(userObject.requestParams);
			return;
		}

		solace.PubSubTools.log.debug("CLIENT " + client.m_clientIdStr + ": Cache request complete (requestId: " + requestId + ")");

		client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheRespRecv, 1);

		switch(returnCode) {
			case solace.CacheReturnCode.OK:
				client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqOk, 1);
				break;

			case solace.CacheReturnCode.INCOMPLETE:
				switch(returnSubcode) {
					case solace.CacheReturnSubcode.NO_DATA:
						client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqIncompNoData, 1);
						break;
					case solace.CacheReturnSubcode.SUSPECT_DATA:
						client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqIncompSuspect, 1);
						break;
					case solace.CacheReturnSubcode.REQUEST_TIMEOUT:
						client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqIncompTimeout, 1);
						break;
					default:
						solace.PubSubTools.log.info("CLIENT " + this.clientIdStr + ": Unusual cache error subcode " + returnSubcode);
						client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqError, 1);
						break;
				}

				break;

			case solace.CacheReturnCode.FAIL:
				switch(returnSubcode) {
					case solace.CacheReturnSubcode.ERROR_RESPONSE:
						break;
					case solace.CacheReturnSubcode.INVALID_SESSION:
						break;
					case solace.CacheReturnSubcode.REQUEST_ALREADY_IN_PROGRESS:
						break;
					default:
						break;
				}
				client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqError, 1);
				break;

			default:
				solace.PubSubTools.log.info("CLIENT " + this.clientIdStr + ": Error with cache event info.  Unexpected RC: " + returnCode);
				client.m_stats.incStat(solace.PubSubTools.perfStatType.numCacheReqError, 1);
				break;
		}

		// In our automated testing environment, a perf-client-collection monitors certain
		// client events.  An event watch is added using registerEventCallback(...).
		if (client.m_eventCallbacks[requestId] !== undefined) {
			while (client.m_eventCallbacks[requestId].length > 0) {
				client.m_eventCallbacks[requestId].pop().onSuccess();
			}
		}
		
		// If the client was issued a list of topics and waitForConfirm was 'true' in the
		// original call to client#cacheRequest(...), the nextRequest is issued upon
		// completion of the previous request.
		if (typeof(nextRequest) !== 'undefined') {

			try {
				client.m_cacheSession.sendCacheRequest(
					nextRequest.requestId,
					nextRequest.topic,
					nextRequest.wantSubscribe,
					nextRequest.liveDataAction,
					new solace.CacheCBInfo(client.cacheRequestEventCb, {client: client, requestParams: nextRequest})
				);
			} catch (e) {
				if (e.name === "OperationError" &&
					e.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {

					// We didn't have enough space in our transport.  Queue work for later.
					// Work queues are processed upon receipt of a CAN_ACCEPT_DATA event.

					this.m_cacheRequestWorkQueue.enqueue(nextRequest);

				} else {
					throw new solace.PubSubTools.PubSubError("Error in sendCacheRequest failed: " + e.message);
				}
			}
		}
	};


	solace.PubSubTools.Client.prototype.connect = function () {

		if (this.m_isConnected) { return; }

		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to connect a session that is null.");
		}

		try {
			this.m_session.connect();
		} catch (error) {
			this.m_lastErrorResponse = error;
			solace.PubSubTools.log.error("Failed to connect session");
			solace.PubSubTools.log.error(error.toString());
		}

		if (this.m_clientProperties.wantTraceContextProp && solace.isTracingInit === undefined) {
			try {
				var compositePropagator = new solace.tracingCore.CompositePropagator({
					propagators: [
						new solace.tracingCore.W3CBaggagePropagator(),
						new solace.tracingCore.W3CTraceContextPropagator()
					]
				});
				solace.tracingApi.propagation.setGlobalPropagator(compositePropagator);
				var tracerProvider = new solace.tracingBase.BasicTracerProvider({
					resource: new solace.tracingResources.Resource({
						"service.name": "sdkperf_nodejs"
					})
				}); 
				if (this.m_clientProperties.traceExporterConnectionString !== undefined && this.m_clientProperties.traceExporterConnectionString !== "") {
					var exporter = new solace.otlpGrpc.OTLPTraceExporter({
						url: this.m_clientProperties.traceExporterConnectionString
					});
					var processor = new solace.tracingBase.BatchSpanProcessor(exporter, {
						maxExportBatchSize: this.m_clientProperties.traceExporterBatchSize,
						maxQueueSize: this.m_clientProperties.traceExporterQueueSize,
						scheduledDelayMillis: this.m_clientProperties.traceExporterScheduleDelay
					});
					tracerProvider.addSpanProcessor(processor);
				}
				tracerProvider.register();
				solace.isTracingInit = true;
			} catch (traceInitError) {
				solace.PubSubTools.log.error("Caught error setting up tracing: " + traceInitError);
			}
		}
	};


	solace.PubSubTools.Client.prototype.disconnect = function () {
		
		if (!this.m_isConnected) { return; }

		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to disconnect a session that is null.");
		}

		if (this.m_customClientName) {
			this.m_clientName = this.getClientName();
		}

		this.m_session.disconnect();
		this.m_isConnected = false;
		this.m_connectionState = CONNECTION_STATES.DISCONNECTED;
	};


	solace.PubSubTools.Client.prototype.dispose = function () {
		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to dispose a session that is null");
		}

		this.disconnect();
		
		this.m_session.dispose();
	};


	solace.PubSubTools.Client.prototype.isConnected = function () {
		return this.m_isConnected;
	};


	solace.PubSubTools.Client.prototype.startData = function () { 
		try {
			for(var key in this.m_SubscriberFlows) {
				if(this.m_SubscriberFlows.hasOwnProperty(key)){
					this.m_SubscriberFlows[key].start();
				}
			}
		}catch(error){
			this.m_lastErrorResponse = error;
			throw error;
		}
	};


	solace.PubSubTools.Client.prototype.stopData = function () { 
		try {
			for(var key in this.m_SubscriberFlows) {
				if(this.m_SubscriberFlows.hasOwnProperty(key)){
					this.m_SubscriberFlows[key].stop();
				}
			}
		} catch(error) {
			this.m_lastErrorResponse = error;
			throw error;
		}
	};


	solace.PubSubTools.Client.prototype.updatePublishProps = function (pubProps) {
		this.m_publishProperties = pubProps;
		this.m_wantPublishFlags = pubProps.deliverToOne ||
								  pubProps.elidingEligible;

		this.m_txStatsProperties.wantCrcCheck         = pubProps.wantCrcCheck;
		this.m_txStatsProperties.wantUserPropToolData = pubProps.wantUserPropToolData;
		this.m_txStatsProperties.wantOrderCheck       = pubProps.wantOrderCheck;
		this.m_txStatsProperties.wantLatency          = pubProps.wantLatency;
		this.m_txStatsProperties.wantOrderMemory      = pubProps.wantOrderMemory;

		this.m_pubMsg.reset();
	};


	solace.PubSubTools.Client.prototype.publishMessage = function (msgProps) {
		var setter = null;
		var getter = null;
		var tracer = null;
		var ctx = null;
		var span = null;
		var dest = null;
		var bagToInject = null;
		var bagCommaSplit = null;
		var oneBagKeyVal = null;
		if (this.m_publishProperties.wantTraceCreationContext || this.m_publishProperties.wantTraceTransportContext || (this.m_publishProperties.baggage !== undefined && this.m_publishProperties.baggage !== "")) {
			setter = new solace.solaceW3C.SolaceW3CTextMapSetter();
			getter = new solace.solaceW3C.SolaceW3CTextMapGetter();
			tracer = solace.tracingApi.trace.getTracer('sdkperf_nodejs');
			ctx = solace.tracingApi.context.active();
			if (msgProps.topic !== null) {
				dest = msgProps.topic;
			} else{
				dest = msgProps.queue;
			}
			// By default, we don't reset the message as it is expensive, however the tracing info is not cleared
			// when we add more (instead it just goes in the transport context for example).  If the user wants anything
			// to do with tracing it's safer to just reset the message and take the performance hit
			this.m_pubMsg.reset();
		}

		if (this.m_publishProperties.wantTraceCreationContext) {
			span = tracer.startSpan(dest + ' sdkperf_nodejs_create',{kind: solace.tracingApi.SpanKind.PRODUCER}, ctx);
		}

		if (msgProps.messageObjectType !== undefined && msgProps.messageObjectType !== null && msgProps.messageObjectType !== "") {
			// New message when using object type
			this.m_pubMsg = solace.SolclientFactory.createMessage();
			if (msgProps.messageObjectType.toLowerCase() === "b") {
				this.m_pubMsg.setBinaryAttachment("123");
			} else if (msgProps.messageObjectType.toLowerCase() === "t") {
				var stringSDT = solace.SDTField.create(solace.SDTFieldType.STRING, "TEXT_MESSAGE");
				this.m_pubMsg.setSdtContainer(stringSDT);
			} else if (msgProps.messageObjectType.toLowerCase() === "m") {
				var mapContainer = new solace.SDTMapContainer();
				mapContainer.addField("MAP", solace.SDTFieldType.STRING, "MESSAGE");
				var mapSDT = solace.SDTField.create(solace.SDTFieldType.MAP, mapContainer);
				this.m_pubMsg.setSdtContainer(mapSDT);
			} else if (msgProps.messageObjectType.toLowerCase() === "s") {
				var streamContainer = new solace.SDTStreamContainer();
				streamContainer.addField(solace.SDTFieldType.STRING, "STREAM_MESSAGE");
				var streamSDT = solace.SDTField.create(solace.SDTFieldType.STREAM, streamContainer);
				this.m_pubMsg.setSdtContainer(streamSDT);
			}
			this.m_pubMsg.setApplicationMessageType(msgProps.messageObjectType);
		}

		this.buildMsg(this.m_pubMsg, msgProps);
		if (this.m_publishProperties.wantTraceCreationContext) {
			ctx = solace.tracingApi.trace.setSpan(ctx, span);
			if (this.m_publishProperties.baggage !== undefined && this.m_publishProperties.baggage !== "") {
				bagToInject = {};
				bagCommaSplit = this.m_publishProperties.baggage.split(",");
				for(var i=0; i < bagCommaSplit.length; i++) {
					oneBagKeyVal = bagCommaSplit[i].split("=");
					bagToInject[oneBagKeyVal[0]] = {
						value: oneBagKeyVal[1],
						metadata: undefined
					};
				}
				ctx = solace.tracingApi.propagation.setBaggage(ctx, solace.tracingApi.propagation.createBaggage(bagToInject));
			}
			solace.tracingApi.propagation.inject(ctx, this.m_pubMsg, setter);
			span.end();
		} else if (!this.m_publishProperties.wantTraceCreationContext && (this.m_publishProperties.baggage !== undefined && this.m_publishProperties.baggage !== "")) {
			bagToInject = {};
			bagCommaSplit = this.m_publishProperties.baggage.split(",");
			for(var j=0; j < bagCommaSplit.length; j++) {
				oneBagKeyVal = bagCommaSplit[j].split("=");
				bagToInject[oneBagKeyVal[0]] = {
					value: oneBagKeyVal[1],
					metadata: undefined
				};
			}
			ctx = solace.tracingApi.propagation.setBaggage(ctx, solace.tracingApi.propagation.createBaggage(bagToInject));
			solace.tracingApi.propagation.inject(ctx, this.m_pubMsg, setter);
		}

		try {
			if (this.m_publishProperties.wantTraceTransportContext) {
				var parentContext = solace.tracingApi.propagation.extract(solace.tracingApi.ROOT_CONTEXT, this.m_pubMsg, getter);
				span = tracer.startSpan(dest + ' sdkperf_nodejs_send',{kind: solace.tracingApi.SpanKind.PRODUCER}, parentContext || undefined);
				ctx = solace.tracingApi.trace.setSpan(ctx, span);
				solace.tracingApi.propagation.inject(ctx, this.m_pubMsg, setter);
			}
			this.m_session.send(this.m_pubMsg);
			if (this.m_publishProperties.wantTraceTransportContext) {
				span.end();
			}

			if (this.m_publishProperties.priorityProbabilityArray.length > 0 &&
				this.m_pubMsg.getPriority() !== undefined &&
				this.m_pubMsg.getPriority() !== null) {
			  var statKey = solace.PubSubTools.perfStatType.numMsgsPriSentMore;
			  var prio = this.m_pubMsg.getPriority();
			  if (prio < 10) {
				  statKey = solace.PubSubTools.perfStatType["numMsgsPriSent"+prio];
			  }
			  this.m_stats.incStat(statKey, 1);
			}
		
		} catch (error) {
			this.m_lastErrorResponse = error;
			if (this.m_publishProperties.wantTraceTransportContext) {
				span.end();
			}
			throw error;
		}
	};

	
	solace.PubSubTools.Client.prototype.publishSendMultiple = function (msgPropsList) {

		var i, msgArray;

		msgArray = this.m_sendVectList;

		if (msgArray.length < msgPropsList.length) {
			throw new solace.PubSubTools.PubSubError("CLIENT " + this.m_clientId + ": Send vector set incorrect: " + msgArray.length + " " + msgPropsList.length);
		}

		// The javascript API doesn't support send vectors, so we will simulate the behavior.
		for (i = 0; i < msgPropsList.length; ++i) {
			this.publishMessage(msgPropsList[i]);
		}
	};

	solace.PubSubTools.Client.prototype.queueUpdate = function (queueList, isAdding, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS) {
		var i, queueDescriptor;
		// Start with an empty m_flowTaskList
		this.m_flowTaskList = [];
		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to queueUpdate using a session that is null.");
		}

		if (isAdding) {
			for (i = 0; i < queueList.length; ++i) {
				queueDescriptor = { // type: QueueDescriptor
					name:       queueList[i],
					type:       solace.QueueType.QUEUE,
					durable:    true
				};

				var messageConsumerProperties = { 
					queueDescriptor:         queueDescriptor,
					acknowledgeMode:         this.m_flowPropertiesAcknowledgeMode,   // type = MessageConsumerAcknowledgeMode
					activeIndicationEnabled: activeFlowInd,
					createIfMissing:         wantMRCS
				};

				var iWindowSize = this.m_clientProperties.subscribeWindow;
				if(iWindowSize!==undefined && iWindowSize!==null) {
					messageConsumerProperties.windowSize = iWindowSize;
				}

				var iNoLocal = this.m_clientProperties.wantNoLocal;
				if(iNoLocal !==undefined && iNoLocal !==null) {
					messageConsumerProperties.noLocal = iNoLocal;
				}
				
				var iAckTimeout = this.m_clientProperties.subscribeAckTime;
				if(iAckTimeout!==undefined && iAckTimeout!==null) {
					messageConsumerProperties.acknowledgeTimeoutInMsecs = iAckTimeout;
				}
				
				var iAckThresh = this.m_clientProperties.subscribeAckThresh;
				if(iAckThresh!==undefined && iAckThresh!==null) {
					messageConsumerProperties.acknowledgeThreshold = iAckThresh;
				}

				if(wantReplayFromDate !== undefined && wantReplayFromDate !== null && wantReplayFromDate !== "") {
					messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplayStartLocationDate(new Date(wantReplayFromDate));
				} else if(wantReplayFromMsgId !== undefined && wantReplayFromMsgId !== null && wantReplayFromMsgId !== "") {
                    messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplicationGroupMessageId(wantReplayFromMsgId);
                } else if(wantReplay !== undefined && wantReplay !== null && wantReplay === true) {
					messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplayStartLocationBeginning();
				}

                if(flowReconnectAttempts !== undefined && flowReconnectAttempts !== null ) {
                    messageConsumerProperties.reconnectAttempts = flowReconnectAttempts;
                }

                if(flowReconnectIntervalInMsecs !== undefined && flowReconnectIntervalInMsecs !== null) {
                    messageConsumerProperties.reconnectIntervalInMsecs = flowReconnectIntervalInMsecs;
                }

				var requiredSettlementsString = "";
				if (requiredSettlements === undefined || requiredSettlements === null || requiredSettlements.length === 0) {
					requiredSettlementsString = this.m_clientProperties.requiredSettlements;
				} else {
					requiredSettlementsString = requiredSettlements[i % requiredSettlements.length];
				}
				if (requiredSettlementsString !== "") {
					var requiredSettlemtsArray = [];
					if (requiredSettlementsString.toUpperCase().includes("A")) {
						requiredSettlemtsArray.push(solace.MessageOutcome.ACCEPTED);
					}
					if (requiredSettlementsString.toUpperCase().includes("R")) {
						requiredSettlemtsArray.push(solace.MessageOutcome.REJECTED);
					}
					if (requiredSettlementsString.toUpperCase().includes("F")) {
						requiredSettlemtsArray.push(solace.MessageOutcome.FAILED);
					}
					messageConsumerProperties.requiredSettlementOutcomes = requiredSettlemtsArray;
				}

				var settlementPatternString = "";
				var settlementUtil = null;
				if (settlementPatterns === undefined || settlementPatterns === null || settlementPatterns.length === 0) {
					settlementPatternString = this.m_clientProperties.settlementPattern;
				} else {
					settlementPatternString = settlementPatterns[i % settlementPatterns.length];
				}
				if (settlementPatternString !== "") {
					settlementUtil = new solace.PubSubTools.SettlementUtil(settlementPatternString);
				}
				
				this.m_subscriptionWorkQueue.enqueue({
					isAdding:      true,
					consumerProps: messageConsumerProperties,
					consumerSet:   this.m_durableQueueConsumers,
					settlementUtil: settlementUtil
				});
			}
		} else {
			for(i=0; i<queueList.length; i++) {
				var consumer = this.m_durableQueueConsumers[queueList[i]];
				if (consumer !== undefined) {
					this.m_subscriptionWorkQueue.enqueue({
						isAdding: false,
						consumer: consumer
					});
					delete this.m_durableQueueConsumers[queueList[i]];
				} else {
					consumer = this.m_SubscriberFlows[queueList[i]];
					if (consumer !== undefined) {
						this.m_subscriptionWorkQueue.enqueue({
							isAdding: false,
							consumer: consumer
						});
					}
				}
			}
		}

		this.processWorkQueues();
	};

	solace.PubSubTools.Client.prototype.topicUpdate = function (endpointList, topicsList, isAdding, unsubscribeTopic, activeFlowInd, wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, requiredSettlements, settlementPatterns, wantMRCS) {
		var i, topicDestination, queueDescriptor;
		// Start with an empty m_flowTaskList
		this.m_flowTaskList = [];

		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to topicUpdate using a session that is null.");
		}

		if ( endpointList === undefined || endpointList.length ===0 ) {
			throw new solace.PubSubTools.PubSubError("Attempt to topicUpdate with empty endpoint list");
		}

		if(isAdding===true) {
			if ( topicsList === undefined || topicsList.length === 0 ) {
				throw new solace.PubSubTools.PubSubError("Attempt to topicUpdate with empty topic list.");
			}

			if ( topicsList.length !== endpointList.length ) {
				throw new solace.PubSubTools.PubSubError("Attempt to topicUpdate with unequal no. of topics and endpoints.");
			}
	   
			var messageConsumerProperties = {};

			for (i = 0; i < endpointList.length; ++i) {
				queueDescriptor = {
					name: endpointList[i],
					type: solace.QueueType.TOPIC_ENDPOINT,
					durable: true
				};

				topicDestination = solace.SolclientFactory.createTopicDestination( topicsList[i] );
				messageConsumerProperties = {
					queueDescriptor:            queueDescriptor,
					topicEndpointSubscription:  topicDestination,
					acknowledgeMode:            this.m_flowPropertiesAcknowledgeMode,
					activeIndicationEnabled:    activeFlowInd,
					noLocal:                    this.m_clientProperties.wantNoLocal,
					createIfMissing:            wantMRCS
				};

				if(wantReplayFromDate !== undefined && wantReplayFromDate !== null && wantReplayFromDate !== "") {
					messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplayStartLocationDate(new Date(wantReplayFromDate));
				} else if(wantReplayFromMsgId !== undefined && wantReplayFromMsgId !== null && wantReplayFromMsgId !== "") {
                    messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplicationGroupMessageId(wantReplayFromMsgId);
                } else if(wantReplay !== undefined && wantReplay !== null && wantReplay === true) {
					messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplayStartLocationBeginning();
				}

                if(flowReconnectAttempts !== undefined && flowReconnectAttempts !== null ) {
                    messageConsumerProperties.reconnectAttempts = flowReconnectAttempts;
                }

                if(flowReconnectIntervalInMsecs !== undefined && flowReconnectIntervalInMsecs !== null) {
                    messageConsumerProperties.reconnectIntervalInMsecs = flowReconnectIntervalInMsecs;
                }

				var requiredSettlementsString = "";
				if (requiredSettlements === undefined || requiredSettlements === null || requiredSettlements.length === 0) {
					requiredSettlementsString = this.m_clientProperties.requiredSettlements;
				} else {
					requiredSettlementsString = requiredSettlements[i % requiredSettlements.length];
				}
				if (requiredSettlementsString !== "") {
					var requiredSettlemtsArray = [];
					if (requiredSettlementsString.toUpperCase().includes("A")) {
						requiredSettlemtsArray.push(solace.MessageOutcome.ACCEPTED);
					}
					if (requiredSettlementsString.toUpperCase().includes("R")) {
						requiredSettlemtsArray.push(solace.MessageOutcome.REJECTED);
					}
					if (requiredSettlementsString.toUpperCase().includes("F")) {
						requiredSettlemtsArray.push(solace.MessageOutcome.FAILED);
					}
					messageConsumerProperties.requiredSettlementOutcomes = requiredSettlemtsArray;
				}

				var settlementPatternString = "";
				var settlementUtil = null;
				if (settlementPatterns === undefined || settlementPatterns === null || settlementPatterns.length === 0) {
					settlementPatternString = this.m_clientProperties.settlementPattern;
				} else {
					settlementPatternString = settlementPatterns[i % settlementPatterns.length];
				}
				if (settlementPatternString !== "") {
					settlementUtil = new solace.PubSubTools.SettlementUtil(settlementPatternString);
				}
				
				this.m_subscriptionWorkQueue.enqueue({
					isAdding:       true,
					consumerProps:  messageConsumerProperties,
					consumerSet:    this.m_dteConsumers,
					settlementUtil: settlementUtil
				});
			}
		} else {
			for(i=0; i<endpointList.length; i++) {
				var consumer = this.m_dteConsumers[endpointList[i]];
				if (consumer !== undefined) {
					this.m_subscriptionWorkQueue.enqueue({
						isAdding:         false,
						consumer:         consumer,
						unsubscribeTopic: unsubscribeTopic
					});
					delete this.m_dteConsumers[endpointList[i]];
				} else {
					consumer = this.m_SubscriberFlows[endpointList[i]];
					if (consumer !== undefined) {
						this.m_subscriptionWorkQueue.enqueue({
							isAdding: false,
							consumer: consumer
						});
					}
				}
			}
		}

		this.processWorkQueues();
	};

	solace.PubSubTools.Client.prototype.tempEndpointUpdate = function(isTe, numEps, arrTopicsList, selectorsList, maxMsgSize, quota, epPermission, respectTTL, noLocal,
																					activeFlowInd, discardNotifySender, maxMsgRedelivery, sessionName, clientIndex, accessType,
																					wantReplay, wantReplayFromDate, wantReplayFromMsgId, flowReconnectAttempts, flowReconnectIntervalInMsecs, 
																					requiredSettlements, settlementPatterns) {

		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempted to topicEndpointUpdate using a session that is null.");
		}

		var topicsList = [];
		if(arrTopicsList!==undefined && arrTopicsList!==null) {
			topicsList = arrTopicsList;
		}

		this.m_retTempEndpointNames = [];

		if(epPermission!==undefined && epPermission!==null) {
			if(epPermission.toUpperCase()==="D") {
				epPermission = solace.QueuePermissions.DELETE;
			} else if(epPermission.toUpperCase()==="M") {
				epPermission = solace.QueuePermissions.MODIFY_TOPIC;
			} else if(epPermission.toUpperCase()==="C") {
				epPermission = solace.QueuePermissions.CONSUME;
			} else if(epPermission.toUpperCase()==="R") {
				epPermission = solace.QueuePermissions.READ_ONLY;
			} else {
				epPermission = undefined;
			}
		}

		if (discardNotifySender!==undefined && discardNotifySender!==null) {
			if(discardNotifySender.toUpperCase()==="ON") {
				discardNotifySender = solace.QueueDiscardBehavior.NOTIFY_SENDER_ON;
			} else if(discardNotifySender.toUpperCase()==="OFF") {
				discardNotifySender = solace.QueueDiscardBehavior.NOTIFY_SENDER_OFF;
			} else {
				discardNotifySender = undefined;
			}
		}

		var i;
		for(i=0; i<numEps; i++) {
			var queueDescriptor;
			var queueProperties;
			var messageConsumerProperties;

			queueDescriptor = {
				type: isTe===true ? solace.QueueType.TOPIC_ENDPOINT : solace.QueueType.QUEUE,
				durable: false
			};
			queueProperties = {
				//queueProperties cannot specify accessType in creation of a temporary queue
				//accessType: accessType,                                         // Default: solace.QueueAccessType.EXCLUSIVE, (solace.QueueAccessType.NONEXCLUSIVE)
				discardBehavior: discardNotifySender,
				maxMessageRedelivery: maxMsgRedelivery,
				maxMessageSize: maxMsgSize,
				permissions: epPermission,
				quotaMB: quota,
				respectsTTL: respectTTL                                         // Default: false
			};
			messageConsumerProperties = {
				queueDescriptor:                queueDescriptor,
				queueProperties:                queueProperties,
				acknowledgeMode:                this.m_flowPropertiesAcknowledgeMode,               // Not sure about this one
				acknowledgeThreshold:           this.m_clientProperties.acknowledgeThreshold,       // Default: 60, Valid Range: >=1 and <= 75
				acknowledgeTimeoutInMsecs:      this.m_clientProperties.acknowledgeTimeoutInMsecs,  // Default: 1000, Valid Range: >= 20 and <= 1500
				connectAttempts:                this.m_clientProperties.connectTries,               // Default: 3, Valid Range: >= 1
				activeIndicationEnabled:        isTe===false ? activeFlowInd : false,               // Boolean - activeIndicationEnabled can only be true for queues not topics
				connectTimeoutInMsecs:          this.m_clientProperties.connectTimeoutInMsecs,      // Default: 10000, Valid Range: >= 50
				noLocal:                        noLocal,
				//topicEndpointSubscription:      isTe===true ? destination : undefined,            // type: solace.Topic
				windowSize:                     this.m_clientProperties.windowSize                  // Not sure about this one
			};

			if(wantReplayFromDate !== undefined && wantReplayFromDate !== null && wantReplayFromDate !== "") {
				messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplayStartLocationDate(new Date(wantReplayFromDate));
			} else if(wantReplayFromMsgId !== undefined && wantReplayFromMsgId !== null && wantReplayFromMsgId !== "") {
                messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplicationGroupMessageId(wantReplayFromMsgId);
            } else if(wantReplay !== undefined && wantReplay !== null && wantReplay === true) {
				messageConsumerProperties.replayStartLocation = solace.SolclientFactory.createReplayStartLocationBeginning();
			}

            if(flowReconnectAttempts !== undefined && flowReconnectAttempts !== null ) {
                messageConsumerProperties.reconnectAttempts = flowReconnectAttempts;
            }

            if(flowReconnectIntervalInMsecs !== undefined && flowReconnectIntervalInMsecs !== null) {
                messageConsumerProperties.reconnectIntervalInMsecs = flowReconnectIntervalInMsecs;
            }
				
			// topicEndpointSubscription is only valid if the queue type is TOPIC_ENDPOINT otherwise it should be undefined.
			if( messageConsumerProperties.queueDescriptor.type===solace.QueueType.TOPIC_ENDPOINT && topicsList.length > 0 ) {
				messageConsumerProperties.topicEndpointSubscription =
					solace.SolclientFactory.createTopicDestination( topicsList[i % topicsList.length] );
			}

			var requiredSettlementsString = "";
			if (requiredSettlements === undefined || requiredSettlements === null || requiredSettlements.length === 0) {
				requiredSettlementsString = this.m_clientProperties.requiredSettlements;
			} else {
				requiredSettlementsString = requiredSettlements[i % requiredSettlements.length];
			}
			if (requiredSettlementsString !== "") {
				var requiredSettlemtsArray = [];
				if (requiredSettlementsString.toUpperCase().includes("A")) {
					requiredSettlemtsArray.push(solace.MessageOutcome.ACCEPTED);
				}
				if (requiredSettlementsString.toUpperCase().includes("R")) {
					requiredSettlemtsArray.push(solace.MessageOutcome.REJECTED);
				}
				if (requiredSettlementsString.toUpperCase().includes("F")) {
					requiredSettlemtsArray.push(solace.MessageOutcome.FAILED);
				}
				messageConsumerProperties.requiredSettlementOutcomes = requiredSettlemtsArray;
			}

			var settlementPatternString = "";
			var settlementUtil = null;
			if (settlementPatterns === undefined || settlementPatterns === null || settlementPatterns.length === 0) {
				settlementPatternString = this.m_clientProperties.settlementPattern;
			} else {
				settlementPatternString = settlementPatterns[i % settlementPatterns.length];
			}
			if (settlementPatternString !== "") {
				settlementUtil = new solace.PubSubTools.SettlementUtil(settlementPatternString);
			}

			this.m_subscriptionWorkQueue.enqueue({
				isAdding:       true,
				consumerProps:  messageConsumerProperties,
				settlementUtil: settlementUtil
			});
		}

		this.processWorkQueues();
	};

	solace.PubSubTools.Client.prototype.endpointProvisioning = function(ep_list, isTopicEndpoint, accessType, maxMsgSize, quota, 
																		permission, respectTtl, discardNotifySender, maxMsgRedelivery, isAdding) {

		var provPermission;
		if(permission!==undefined && permission!==null) {
			if(permission.toUpperCase()==="D") {
				provPermission = solace.QueuePermissions.DELETE;
			} else if(permission.toUpperCase()==="M") {
				provPermission = solace.QueuePermissions.MODIFY_TOPIC;
			} else if(permission.toUpperCase()==="C") {
				provPermission = solace.QueuePermissions.CONSUME;
			} else if(permission.toUpperCase()==="R") {
				provPermission = solace.QueuePermissions.READ_ONLY;
			}
		}

		var provDiscardNotifySender;
		if (discardNotifySender!==undefined && discardNotifySender!==null) {
			if(discardNotifySender.toUpperCase()==="ON") {
				provDiscardNotifySender = solace.QueueDiscardBehavior.NOTIFY_SENDER_ON;
			} else if(discardNotifySender.toUpperCase()==="OFF") {
				provDiscardNotifySender = solace.QueueDiscardBehavior.NOTIFY_SENDER_OFF;
			}
		}

		var provAccessType;
		if (accessType!==undefined && accessType!==null) {
			if( accessType===0 || accessType==="0" ) {
				provAccessType = solace.QueueAccessType.NONEXCLUSIVE;
			} else if( accessType===1 || accessType==="1" ){
				provAccessType = solace.QueueAccessType.EXCLUSIVE;
			}
		}

		var i;
		for (i = 0; i < ep_list.length; ++i) {

			var epType = ((isTopicEndpoint === true) ? solace.QueueType.TOPIC_ENDPOINT : solace.QueueType.QUEUE);
		
			var epDescriptor = { 
				name:       ep_list[i],
				type:       epType,
				durable:    true
			};
			if (isAdding) {
				var queueProperties = {
					accessType: provAccessType,
					discardBehavior: provDiscardNotifySender,
					maxMessageRedelivery: maxMsgRedelivery,
					maxMessageSize: maxMsgSize,
					permissions: provPermission,
					quotaMB: quota,
					respectsTTL: respectTtl
				};
				
				this.m_subscriptionWorkQueue.enqueue({
					isAdding:       true,
					isProvisioning: true,
					epDesciptor: epDescriptor,
					queueProperties: queueProperties
				});
			} else {
				this.m_subscriptionWorkQueue.enqueue({
					isAdding:       false,
					isProvisioning: true,
					epDesciptor: epDescriptor
				});
			}

		}

		this.processWorkQueues();
	};

	solace.PubSubTools.Client.prototype.unbindAllTempEndpoints = function() {
		for(var key in this.m_SubscriberFlows) {
			if(this.m_SubscriberFlows.hasOwnProperty(key)) {
				// We want only the temporary endpoints.
				if( this.m_SubscriberFlows[key].getProperties().queueDescriptor.durable === false ) {
					this.m_SubscriberFlows[key].stop();
					this.m_SubscriberFlows[key].disconnect();
					delete this.m_SubscriberFlows[key];
				}
			}
		}
	};

	solace.PubSubTools.Client.prototype.mapTopics = function(queue, topicsList, isAdding) {
		// Start with an empty m_mapTopicsList
		this.m_mapTopicsList = [];

		var i;
		for (var flowName in this.m_SubscriberFlows) {
			if(this.m_SubscriberFlows.hasOwnProperty(flowName) && flowName === queue){
				for(i = 0; i < topicsList.length; i++) {
					try {
						var topic = solace.SolclientFactory.createTopicDestination(topicsList[i]);
						this.m_queueWorkQueue.enqueue({
							isAdding:       isAdding,
							topic:          topic,
							consumerObj:    this.m_SubscriberFlows[flowName]
						});
					} catch (error) {
						this.m_lastErrorResponse = error;
						this.m_mapTopicsList = [];
						if (this.m_eventEmitter !== undefined) {
							this.m_eventEmitter.emit(
								"mapTopicsOk",
								this,
								{eventType: "mapTopicsOk"});
						}
						break;
					}
				}
				break;
			}
		}
		this.processWorkQueues();
	};
	
	solace.PubSubTools.Client.prototype.subscriptionUpdate = function (subscriptionsList, isAdding) {
		var i, topic;
		var requestConfirm = false;
		solace.PubSubTools.log.debug("Client::subscriptionUpdate() isAdding="+isAdding);
		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to subscriptionUpdate using a session that is null.");
		}

		try {
			for (i = 0; i < subscriptionsList.length; ++i) {
				
				topic = solace.SolclientFactory.createTopicDestination(subscriptionsList[i]);

				if (i === subscriptionsList.length - 1) {
					requestConfirm = true;
				}

				try {
					if (isAdding) {
							solace.PubSubTools.log.debug("Client::subscriptionUpdate() about to subscribe.  subscriptionsList[i]="+subscriptionsList[i]);
							this.m_session.subscribe(topic, requestConfirm, subscriptionsList[i]);
					} else {
							solace.PubSubTools.log.debug("Client::subscriptionUpdate() about to unsubscribe.  subscriptionsList[i]="+subscriptionsList[i]);
							this.m_session.unsubscribe(topic, requestConfirm, subscriptionsList[i]);
					}
				} catch (subError) {
					if (subError.name === "OperationError" &&
							subError.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {

						// We didn't have enough space in our transport.  Queue work for later.
						// Work queues are processed upon receipt of a CAN_ACCEPT_DATA event.

						this.m_subscriptionWorkQueue.enqueue({
							isAdding:       isAdding,
							topic:          topic,
							requestConfirm: requestConfirm,
							correlationKey: subscriptionsList[i]
						});

					} else {
						throw new solace.PubSubTools.PubSubError("subscriptionUpdate failed: " + subError.message);
					}
				}
			}
		} catch (error) {
			this.m_lastErrorResponse = error;
			throw new solace.PubSubTools.PubSubError("subscriptionUpdate failed: " + error.message);
		}
	};


	solace.PubSubTools.Client.prototype.getSdkStat = function (statType) {
		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to getSdkStat using a session that is null.");
		}
		return this.m_session.getStat(solace.StatType[statType]);
	};


	solace.PubSubTools.Client.prototype.resetStats = function () {
		this.m_msgCount = 0;
		this.m_stats.resetStats();
		this.m_session.resetStats();
	};


	solace.PubSubTools.Client.prototype.getClientName = function () {
		if (this.m_session === null || this.m_session === undefined) {
			throw new solace.PubSubTools.PubSubError("Attempt to getClientName using a session that is null.");
		}
		return this.m_session.getSessionProperties().clientName;
	};


	solace.PubSubTools.Client.prototype.getClientIdStr = function () {
		return this.m_clientIdStr;
	};


	solace.PubSubTools.Client.prototype.setClientName = function (clientName) {
		this.m_session.updateProperty(solace.MutableSessionProperty.CLIENT_NAME, clientName, 3000, null);
		this.m_customClientName = true;
	};

	solace.PubSubTools.Client.prototype.updateAuthOnReconnect = function (accessToken, idToken) {
		try {
			this.m_session.updateAuthenticationOnReconnect({idToken:idToken, accessToken:accessToken});
		} catch (error) {
			this.m_lastErrorResponse = error;
			solace.PubSubTools.log.warn("updateAuthenticationOnReconnect failed:" + "\n\tSubcode: " + solace.ErrorSubcode.describe(error.subcode) + "\n\tMessage: " + error.message);
		}
	};

	solace.PubSubTools.Client.prototype.setToolDataAsProperties = function (msg, msgProps) {
		
		var msgPropMap = new solace.SDTMapContainer();
		var txToolData = msgProps.toolData;
		
		try {

			if (this.m_publishProperties.wantCrcCheck) {

				if (txToolData.hasCrcXmlPayload()) {
					msgPropMap.addField(solace.PubSubTools.ToolData.PROP_XML_PAYLOAD_HASH, solace.SDTFieldType.INT32, txToolData.getCrcXmlPayload());
				}
				
				if (txToolData.hasCrcBinAttach()) {
					msgPropMap.addField(solace.PubSubTools.ToolData.PROP_BIN_PAYLOAD_HASH, solace.SDTFieldType.INT32, txToolData.getCrcBinAttach());
				}
			}
						
			if (txToolData.hasStreamId()) {
				msgPropMap.addField(solace.PubSubTools.ToolData.PROP_STREAM_ID, solace.SDTFieldType.INT32, txToolData.getStreamId());
			} 
			
			if (txToolData.hasMessageId()) {
				msgPropMap.addField(solace.PubSubTools.ToolData.PROP_MESSAGE_ID, solace.SDTFieldType.INT64, txToolData.getMessageId());
			}
			
			if (txToolData.hasLatency()) {
				var latencyTime = txToolData.getLatency();
				if (latencyTime === 0) {
					var nanoseconds = 1000000;
					latencyTime = (new Date()).getTime() * nanoseconds;
				}
				msgPropMap.addField(solace.PubSubTools.ToolData.PROP_LATENCY, solace.SDTFieldType.INT64, latencyTime);
			}

			msg.setUserPropertyMap(msgPropMap);

		} catch (error) {
			solace.PubSubTools.log.warn("CLIENT " + this.clientIdStr + ", error setting properties: " + error.message);
		}
	};

	solace.PubSubTools.Client.prototype.setToolDataAsAttachment = function (msgProps) {

		var attachSize = 0;

		if (this.m_txStatsProperties.wantLatency) {
			if (msgProps.toolData.m_latency === 0) {
				msgProps.toolData.m_latency = (new Date()).getTime();
			}
		}

		if (msgProps.toolData.hasData()) {
			msgProps.updateAttachmentForToolData();
		}
	};

	solace.PubSubTools.Client.prototype.updateToolData = function (msgProps, msgNum) {

		var toolDataSize;

		if (this.m_txStatsProperties.wantToolData() === false) {
			return;
		}

		msgProps.toolData.reset();

		if (this.m_txStatsProperties.wantOrderCheck) {
			msgProps.toolData.setMessageId(msgNum + this.m_publishProperties.publishOrderOffset);
			if (this.m_publishProperties.publishStreamOffset >= 0) {
				msgProps.toolData.setStreamId(this.m_publishProperties.publishStreamOffset + this.m_clientId);
			}
		}

		if (this.m_txStatsProperties.wantCrcCheck) {

			if (msgProps.xmlPayload !== null) {
				msgProps.toolData.setCrcXmlPayload(solace.PubSubTools.crc32(msgProps.xmlPayload));
			}
			
			if (msgProps.attachment !== null) {

				// Tool data size refers to the number of bytes in the binary attachment
				// encoded tool data. For purposes of calculating the crc of the binary
				// attachment without including the tool data portion of the attachment
				// in the calculation, we need to know the size that the tool data will
				// be once encoded.  Note: Tool data size will be zero if the tool data
				// is being sent using a property map.

				toolDataSize = 0;
				if (!this.m_txStatsProperties.wantUserPropToolData) {
					msgProps.toolData.setCrcBinAttach(1);
					toolDataSize = msgProps.toolData.getEncodedSize();
				}

				if (toolDataSize < msgProps.attachment.length) {
					msgProps.toolData.setCrcBinAttach(solace.PubSubTools.crc32(msgProps.attachment.slice(toolDataSize, msgProps.attachment.length)));
				} else {
					msgProps.toolData.clearCrcBinAttach();
				}
			}
		}
	};

	solace.PubSubTools.Client.prototype.registerEventCallback = function (eventType, callback) {

		if (typeof(this.m_eventCallbacks[eventType]) === 'undefined') {
			this.m_eventCallbacks[eventType] = [];
		}

		// When the specified event is received by the client, it will execute all registered callbacks
		// with their associated arguments.  Once executed, the callback is unregistered.
		this.m_eventCallbacks[eventType].push(callback);
	};
	
	solace.PubSubTools.Client.prototype.getRtrCapabilities = function() {
		var map = {};
		
		if(this.m_session.isCapable(solace.CapabilityType.ACTIVE_CONSUMER_INDICATION)!==null){
			map.SESSION_CAPABILITY_ACTIVE_FLOW_INDICATION		=this.m_session.isCapable(solace.CapabilityType.ACTIVE_CONSUMER_INDICATION) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.COMPRESSION)!==null){
			map.SESSION_CAPABILITY_COMPRESSION					=this.m_session.isCapable(solace.CapabilityType.COMPRESSION) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.CUT_THROUGH)!==null){
			map.SESSION_CAPABILITY_CUT_THROUGH					=this.m_session.isCapable(solace.CapabilityType.CUT_THROUGH) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.ENDPOINT_DISCARD_BEHAVIOR)!==null){
			map.SESSION_CAPABILITY_ENDPOINT_DISCARD_BEHAVIOR	=this.m_session.isCapable(solace.CapabilityType.ENDPOINT_DISCARD_BEHAVIOR) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.ENDPOINT_MESSAGE_TTL)!==null){
			map.SESSION_CAPABILITY_ENDPOINT_MESSAGE_TTL			=this.m_session.isCapable(solace.CapabilityType.ENDPOINT_MESSAGE_TTL) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.ENDPOINT_MGMT)!==null){
			map.SESSION_CAPABILITY_ENDPOINT_MANAGEMENT			=this.m_session.isCapable(solace.CapabilityType.ENDPOINT_MGMT) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.GUARANTEED_MESSAGE_BROWSE)!==null){
			map.SESSION_CAPABILITY_BROWSER						=this.m_session.isCapable(solace.CapabilityType.GUARANTEED_MESSAGE_BROWSE) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.GUARANTEED_MESSAGE_CONSUME)!==null){
			map.SESSION_CAPABILITY_SUB_FLOW_GUARANTEED			=this.m_session.isCapable(solace.CapabilityType.GUARANTEED_MESSAGE_CONSUME) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.GUARANTEED_MESSAGE_PUBLISH)!==null){
			map.SESSION_CAPABILITY_PUB_GUARANTEED				=this.m_session.isCapable(solace.CapabilityType.GUARANTEED_MESSAGE_PUBLISH) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.JNDI)!==null){
			map.SESSION_CAPABILITY_JNDI							=this.m_session.isCapable(solace.CapabilityType.JNDI) ? "1" : "0";
		}
		if(this.m_session.getCapability(solace.CapabilityType.MAX_DIRECT_MSG_SIZE)!==null){
			map.SESSION_CAPABILITY_MAX_DIRECT_MSG_SIZE			=""+this.m_session.getCapability(solace.CapabilityType.MAX_DIRECT_MSG_SIZE).getValue();
		}
		if(this.m_session.getCapability(solace.CapabilityType.MAX_GUARANTEED_MSG_SIZE)!==null){
			map.SESSION_CAPABILITY_MAX_GUARANTEED_MSG_SIZE		=""+this.m_session.getCapability(solace.CapabilityType.MAX_GUARANTEED_MSG_SIZE).getValue();
		}
		if(this.m_session.isCapable(solace.CapabilityType.MESSAGE_ELIDING)!==null){
			map.SESSION_CAPABILITY_MESSAGE_ELIDING				=this.m_session.isCapable(solace.CapabilityType.MESSAGE_ELIDING) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.NO_LOCAL)!==null){
			map.SESSION_CAPABILITY_NO_LOCAL						=this.m_session.isCapable(solace.CapabilityType.NO_LOCAL) ? "1" : "0";
		}
		if(this.m_session.getCapability(solace.CapabilityType.PEER_PLATFORM)!==null){
			map.SESSION_PEER_PLATFORM							=""+this.m_session.getCapability(solace.CapabilityType.PEER_PLATFORM).getValue();
		}
		if(this.m_session.getCapability(solace.CapabilityType.PEER_PORT_SPEED)!==null){
			map.SESSION_PEER_PORT_SPEED							=""+this.m_session.getCapability(solace.CapabilityType.PEER_PORT_SPEED).getValue();
		}
		if(this.m_session.getCapability(solace.CapabilityType.PEER_PORT_TYPE).getValue()===0){
			map.SESSION_PEER_PORT_TYPE							="Ethernet";
		} else if(this.m_session.getCapability(solace.CapabilityType.PEER_PORT_TYPE)!==null){
			map.SESSION_PEER_PORT_TYPE							=""+this.m_session.getCapability(solace.CapabilityType.PEER_PORT_TYPE).getValue();
		}
		if(this.m_session.getCapability(solace.CapabilityType.PEER_ROUTER_NAME)!==null){
			map.SESSION_PEER_ROUTER_NAME						=""+this.m_session.getCapability(solace.CapabilityType.PEER_ROUTER_NAME).getValue();
		}
		if(this.m_session.getCapability(solace.CapabilityType.PEER_SOFTWARE_DATE)!==null){
			map.SESSION_PEER_SOFTWARE_DATE						=""+this.m_session.getCapability(solace.CapabilityType.PEER_SOFTWARE_DATE).getValue();
		}
		if(this.m_session.getCapability(solace.CapabilityType.PEER_SOFTWARE_VERSION)!==null){
			map.SESSION_PEER_SOFTWARE_VERSION					=""+this.m_session.getCapability(solace.CapabilityType.PEER_SOFTWARE_VERSION).getValue();
		}
		if(this.m_session.isCapable(solace.CapabilityType.PER_TOPIC_SEQUENCE_NUMBERING)!==null){
			map.SESSION_CAPABILITY_PER_TOPIC_SEQUENCE_NUMBERING	=this.m_session.isCapable(solace.CapabilityType.PER_TOPIC_SEQUENCE_NUMBERING) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.QUEUE_SUBSCRIPTIONS)!==null){
			map.SESSION_CAPABILITY_QUEUE_SUBSCRIPTIONS			=this.m_session.isCapable(solace.CapabilityType.QUEUE_SUBSCRIPTIONS) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.SELECTOR)!==null){
			map.SESSION_CAPABILITY_SELECTOR						=this.m_session.isCapable(solace.CapabilityType.SELECTOR) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.SUBSCRIPTION_MANAGER)!==null){
			map.SESSION_CAPABILITY_SUBSCRIPTION_MANAGER			=this.m_session.isCapable(solace.CapabilityType.SUBSCRIPTION_MANAGER) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.TEMPORARY_ENDPOINT)!==null){
			map.SESSION_CAPABILITY_TEMP_ENDPOINT				=this.m_session.isCapable(solace.CapabilityType.TEMPORARY_ENDPOINT) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.TRANSACTED_SESSION)!==null){
			map.SESSION_CAPABILITY_TRANSACTED_SESSION			=this.m_session.isCapable(solace.CapabilityType.TRANSACTED_SESSION) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.MESSAGE_REPLAY)!==null){
			map.SESSION_CAPABILITY_MESSAGE_REPLAY				=this.m_session.isCapable(solace.CapabilityType.MESSAGE_REPLAY) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.COMPRESSED_SSL)!==null){
			map.SESSION_CAPABILITY_COMPRESSED_SSL				=this.m_session.isCapable(solace.CapabilityType.COMPRESSED_SSL) ? "1" : "0";
		}
		if(this.m_session.isCapable(solace.CapabilityType.SHARED_SUBSCRIPTIONS)!==null){
			map.SESSION_CAPABILITY_SHARED_SUBSCRIPTIONS			=this.m_session.isCapable(solace.CapabilityType.SHARED_SUBSCRIPTIONS) ? "1" : "0";
		}
		
		return map;
	};
	
	solace.PubSubTools.Client.prototype.getChannelState = function() {
		return this.m_connectionState;
	};

	solace.PubSubTools.Client.prototype.getLastMessageDetails = function () {
		return this.m_lastMessageDetails;
	};

	solace.PubSubTools.Client.prototype.getLastMessagesDetails = function (msgsToGet) {
		var details = [];
		if (this.m_lastMessagesDetails === null || msgsToGet <= 1) {
			details.push(this.m_lastMessageDetails.clone());
			return details;
		}

		var minMsgs = msgsToGet;
		if (this.m_lastMessagesDetails.length < minMsgs) {
			minMsgs = this.m_lastMessagesDetails.length;
		}
		solace.PubSubTools.log.debug("Getting " + minMsgs + " messages");

		// Since the queue is FIFO and the user wants the LATEST messages, if they
		// ask for less than we have in the queue we must skip the older messages
		// to return the latest X messages (See SOL-106960 for additional context)
		var offset = 0;
		if (minMsgs < this.m_lastMessagesDetails.length) {
			offset = this.m_lastMessagesDetails.length - minMsgs;
		}
		for (var i = offset; i < minMsgs + offset; i++) {
			details.push(this.m_lastMessagesDetails[i]);
		}
		return details;

	};
	
	solace.PubSubTools.Client.prototype.getLastError = function() {
		return this.m_lastErrorResponse;
	};
	
	solace.PubSubTools.Client.prototype.clearLastError = function() {
		this.m_lastErrorResponse = null;
	};

	solace.PubSubTools.Client.prototype.getFlowStatus = function (epName, epType) {
		var flowStatus = {};
		var epTypeValue, epDurable;
		var key;
		// Check epName and epType are not empty
		if (epName === undefined || epName === "" || 
			epType === undefined || epType === "") {
			throw new solace.PubSubTools.PubSubError("Client: Endpoint name or type cannot be empty.");
		}
		// Check if epType is a valid type
		if (solace.PubSubTools.EndpointTypes[epType] !== undefined) {
			epTypeValue = solace.PubSubTools.EndpointTypes[epType].value;
			epDurable   = solace.PubSubTools.EndpointTypes[epType].durable;
		} else {
			var buf = new solace.StringBuffer();
			buf.append("Client: Endpoint type: " + epType + " is not valid. Valid values: ");
			for (key in solace.PubSubTools.EndpointTypes) {
				if (solace.PubSubTools.EndpointTypes.hasOwnProperty(key)) {
					buf.append(key + ", ");
				}
			}

			throw new solace.PubSubTools.PubSubError(buf.toString());
		}
		// Find the flow in m_subscriberFlows and return the flowStatus
		for (key in this.m_SubscriberFlows) {
			if (this.m_SubscriberFlows.hasOwnProperty(key) &&
				this.m_SubscriberFlows[key].getProperties().queueDescriptor.name === epName &&
				this.m_SubscriberFlows[key].getProperties().queueDescriptor.getType() === epTypeValue &&
				this.m_SubscriberFlows[key].getProperties().queueDescriptor.durable === epDurable) {

				flowStatus.flowUp = this.m_SubscriberFlows[key].flowUp;
				flowStatus.afiState = this.m_SubscriberFlows[key].afiState;
				return flowStatus;
			}
		}
		// If the flow is not found
		throw new solace.PubSubTools.PubSubError("Client: " + this.getClientIdStr() + " - Flow not found for endpoint name: " + epName +
			" of type: " + epType);
	};
	
	solace.PubSubTools.Client.prototype.toString = function () {
		var buf = new solace.StringBuffer();
		buf.append("\n^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n");
		buf.append("Client name: " + this.getClientName() + "\n");
		try {
			// Get Stats for all Stat Types
			Object.keys(solace.StatType).forEach(function eachStatType(statType) {
				buf.append(statType + " = " + this.getSdkStat(statType) + "\n");
			}, this);
		} catch (error) {
			throw new solace.PubSubTools.PubSubError("Error while fetching client stats:" + error.message);
		}
		return buf.toString();
	};

}.apply(solace.PubSubTools));
