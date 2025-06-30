// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    /**
     * @class
     * Represents a base properties object.
     */
    solace.PubSubTools.BaseProperties = function BaseProperties () {};


    solace.PubSubTools.BaseProperties.prototype.toString = function () {
        var result = new solace.StringBuffer("\n");
        var first = true;
        var key;
        for (key in this) {
            if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                if (key === "password") {
                    continue;
                }
                if (first) {
                    result.append(" {")
                        .append(key)
                        .append(", ")
                        .append(this[key])
                        .append("}");
                    first = false;
                }
                else {
                    result.append(",\n ")
                        .append("{")
                        .append(key)
                        .append(", ")
                        .append(this[key])
                        .append("}");
                }
            }
        }
        return result.toString();
    };


    solace.PubSubTools.BaseProperties.prototype.clone = function() {
        var copy = new solace.PubSubTools.BaseProperties();
        for (var p in this) {
            if (this.hasOwnProperty(p)) {
                copy[p] = this[p];
            }
        }
        return copy;
    };


    /**
     * @class
     * Represents a client properties object.
     */
    solace.PubSubTools.ClientProperties = function ClientProperties (runtimeProperties) {

        if (typeof(runtimeProperties) === 'undefined') {
            runtimeProperties = new solace.PubSubTools.RuntimeProperties();
        }

        this.adAckEventMode             = runtimeProperties.getProperty("adAckEventMode"); 
        this.authenticationScheme       = runtimeProperties.getProperty("authenticationScheme"); 
        this.oauthAccessToken           = runtimeProperties.getProperty("oauthAccessToken"); 
        this.oauthIssuerId              = runtimeProperties.getProperty("oauthIssuerId"); 
        this.oauthIdToken               = runtimeProperties.getProperty("oauthIdToken"); 
        this.applicationDescription     = runtimeProperties.getProperty("applicationDescription");
        this.cacheMaxAgeInSecs          = runtimeProperties.getProperty("cacheMaxAgeInSecs");
        this.cacheMaxMessages           = runtimeProperties.getProperty("cacheMaxMessages");
        this.cacheName                  = runtimeProperties.getProperty("cacheName");
        this.cacheTimeoutInMsecs        = runtimeProperties.getProperty("cacheTimeoutInMsecs");
        this.changeClientName           = runtimeProperties.getProperty("changeClientName");
        this.clientMode                 = runtimeProperties.getProperty("clientMode");
        this.clientNamePrefix           = runtimeProperties.getProperty("clientNamePrefix");
        this.clientNum                  = runtimeProperties.getProperty("clientNum");
        this.connectTimeoutInMsecs      = runtimeProperties.getProperty("connectTimeoutInMsecs");
        this.extraPropsList             = runtimeProperties.getProperty("extraPropsList"); 
        this.keepAliveIntervalInMsecs   = runtimeProperties.getProperty("keepAliveIntervalInMsecs");
        this.keepAliveIntervalsLimit    = runtimeProperties.getProperty("keepAliveIntervalsLimit");
        this.maxWebPayload              = runtimeProperties.getProperty("maxWebPayload");
        this.messageDeliveryModeType    = runtimeProperties.getProperty("messageDeliveryModeType"); 
        this.password                   = runtimeProperties.getProperty("password");
        this.publishAckTime             = runtimeProperties.getProperty("publishAckTime"); 
        this.publishWindow              = runtimeProperties.getProperty("publishWindow"); 
        this.readTimeoutInMsecs         = runtimeProperties.getProperty("readTimeoutInMsecs");
        this.reapplySubscriptions       = runtimeProperties.getProperty("reapplySubscriptions");
        this.reconnectRetryCount        = runtimeProperties.getProperty("reconnectRetryCount");
        this.reconnectRetryIntervalInMs = runtimeProperties.getProperty("reconnectRetryIntervalInMs");
        this.sendBufferMaxSize          = runtimeProperties.getProperty("sendBufferMaxSize");
        this.sslCertificate             = runtimeProperties.getProperty("sslCertificate"); 
        this.sslCipherSuites            = runtimeProperties.getProperty("sslCipherSuites"); 
        this.sslExcludedProtocols       = runtimeProperties.getProperty("sslExcludedProtocols"); 
        this.sslProtocol                = runtimeProperties.getProperty("sslProtocol"); 
        this.sslMinProtocolVersion      = runtimeProperties.getProperty("sslMinProtocolVersion"); 
        this.sslMaxProtocolVersion      = runtimeProperties.getProperty("sslMaxProtocolVersion"); 
        this.sslPrivateKey              = runtimeProperties.getProperty("sslPrivateKey"); 
        this.sslPrivateKeyPassword      = runtimeProperties.getProperty("sslPrivateKeyPassword"); 
        this.sslTrustedCommonNameList   = runtimeProperties.getProperty("sslTrustedCommonNameList"); 
        this.sslTrustStores             = runtimeProperties.getProperty("sslTrustStores"); 
        this.sslValidateCertificate     = runtimeProperties.getProperty("sslValidateCertificate"); 
        this.sslValidateCertificateDate = runtimeProperties.getProperty("sslValidateCertificateDate"); 
		this.subscribeAckTime			= runtimeProperties.getProperty("subscribeAckTime"); 
		this.subscribeAckThresh			= runtimeProperties.getProperty("subscribeAckThresh"); 
		this.subscribeWindow			= runtimeProperties.getProperty("subscribeWindow"); 
        this.transportDowngradeTimeoutInMsecs = runtimeProperties.getProperty("transportDowngradeTimeoutInMsecs");
        this.transportProtocol          = runtimeProperties.getProperty("transportProtocol");
        this.url                        = runtimeProperties.getProperty("url");
        this.userName                   = runtimeProperties.getProperty("userName");
        this.vpnName                    = runtimeProperties.getProperty("vpnName");
        this.wantMessageDump            = runtimeProperties.getProperty("wantMessageDump");
        this.wantPrioStats              = runtimeProperties.getProperty("wantPrioStats") || 
            runtimeProperties.getProperty("msgPriorityList") || 
            runtimeProperties.getProperty("msgPriorityFlat");
        this.wantClientAck              = runtimeProperties.getProperty("wantClientAck");   
        this.clientAckSkipNum           = runtimeProperties.getProperty("clientAckSkipNum");   
        this.subMsgQueueDepth           = runtimeProperties.getProperty("subMsgQueueDepth");   
        this.clientAckQueueFlush        = runtimeProperties.getProperty("clientAckQueueFlush");  
        this.clientAckQueueReverse      = runtimeProperties.getProperty("clientAckQueueReverse");   
        this.clientAckRandomDepth       = runtimeProperties.getProperty("clientAckRandomDepth");   
        this.requiredSettlements        = runtimeProperties.getProperty("requiredSettlements");   
        this.settlementPattern          = runtimeProperties.getProperty("settlementPattern");   
        this.wantNoLocal                = runtimeProperties.getProperty("wantNoLocal");
        this.eventEmitter               = runtimeProperties.getProperty("eventEmitter");
        this.clientCompressionLevel     = runtimeProperties.getProperty("clientCompressionLevel");
        this.payloadCompressionLevel    = runtimeProperties.getProperty("payloadCompressionLevel");
        this.sslConnectionDowngradeTo   = runtimeProperties.getProperty("sslConnectionDowngradeTo");
        this.wantStructMsgCheck         = runtimeProperties.getProperty("wantStructMsgCheck");
        this.wantPerMessageDetails      = runtimeProperties.getProperty("wantPerMessageDetails");
        this.perMessageDetailsQueueDepth = runtimeProperties.getProperty("perMessageDetailsQueueDepth");
        this.messageObjectTypeCheck      = runtimeProperties.getProperty("messageObjectTypeCheck");
        
        this.wantTraceContextProp          = runtimeProperties.getProperty("wantTraceContextProp");
        this.traceCopyReceiveContext       = runtimeProperties.getProperty("traceCopyReceiveContext");
        this.traceExporterConnectionString = runtimeProperties.getProperty("traceExporterConnectionString");
        this.traceExporterBatchSize        = runtimeProperties.getProperty("traceExporterBatchSize");
        this.traceExporterScheduleDelay    = runtimeProperties.getProperty("traceExporterScheduleDelay");
        this.traceExporterQueueSize        = runtimeProperties.getProperty("traceExporterQueueSize");

        // We use -1 to indicate 'unspecified'.  The solclientjs expects 'null' for
        // unspecified values.

       if (this.cacheTimeoutInMsecs === -1) {
            this.cacheTimeoutInMsecs = null;
        }

        if (this.cacheMaxAgeInSecs === -1) {
            this.cacheMaxAgeInSecs = null;
        }

        if (this.cacheMaxMessages === -1) {
            this.cacheMaxMessages = null;
        }

    };

    solace.PubSubTools.ClientProperties.prototype = solace.PubSubTools.BaseProperties.prototype;

    solace.PubSubTools.ClientProperties.prototype.generateClientUsername = function (clientId) {
        var clientUsernameStr = "";

        if (this.userName === '') {
            if (this.clientNamePrefix === '') {
                clientUsernameStr = clientUsernameStr + "perf_client";
            } else {
                clientUsernameStr = clientUsernameStr + this.clientNamePrefix;
            }
            clientUsernameStr = clientUsernameStr + solace.PubSubTools.utils.padLeft(clientId, '0', 6);
        } else {
           clientUsernameStr = clientUsernameStr + this.userName;
        }

        return clientUsernameStr;
    };

    solace.PubSubTools.ClientProperties.prototype.generateClientName = function (clientId) {
        var clientNameStr = "";

        if (this.clientNamePrefix === '') {
            clientNameStr = clientNameStr + "perf_client";
        } else {
            clientNameStr = clientNameStr + this.clientNamePrefix;
        }

        clientNameStr = clientNameStr + solace.PubSubTools.utils.padLeft(clientId, '0', 6);

        return clientNameStr;
    };

    /**
     * @class
     * Represents a publish properties object.
     */
    solace.PubSubTools.PublishProperties = function PublishProperties (runtimeProperties) {

        var i, values, start, step, end, sizeList;

        if (typeof(runtimeProperties) === 'undefined') {
            runtimeProperties = new solace.PubSubTools.RuntimeProperties();
        }

        this.messageNum             = runtimeProperties.getProperty("messageNum");
        this.messageRate            = runtimeProperties.getProperty("messageRate");
        this.messageDeliveryModeType= runtimeProperties.getProperty("messageDeliveryModeType"); 
        this.pubMsgType             = runtimeProperties.getProperty("pubMsgType");

        this.deadMessageQueueEligible=runtimeProperties.getProperty("deadMessageQueueEligible");
        this.timeToLiveInMsecs      = runtimeProperties.getProperty("timeToLiveInMsecs");
        this.partitionKeyList       = runtimeProperties.getProperty("partitionKeyList");

        this.msgPriorityList = [];

        if (runtimeProperties.getProperty("msgPriorityFlat")) {
            this.msgPriorityList = [0, 10, 1, 10, 2, 10, 3, 10, 4, 10, 5, 10, 6, 10, 7, 10, 8, 10, 9, 10];
            this.wantPrioStats = true;
        }

        if (runtimeProperties.getProperty("msgPriorityList") instanceof Array) {
            this.msgPriorityList = runtimeProperties.getProperty("msgPriorityList");
            this.wantPrioStats = true;
        } else if (runtimeProperties.getProperty("msgPriorityList") !== "") {
            var tempMsgPriorityList = runtimeProperties.getProperty("msgPriorityList") + "";
            this.msgPriorityList = tempMsgPriorityList.split(',');
            this.wantPrioStats = true;
        }
      
        if (runtimeProperties.getProperty("wantPrioStats")) {
            this.wantPrioStats = true;
        }

        this.publishTopicList       = [];

        if (runtimeProperties.getProperty("publishTopicList") instanceof Array) {
            this.publishTopicList = runtimeProperties.getProperty("publishTopicList");
        } else if (runtimeProperties.getProperty("publishTopicList") !== "") {
            var tempPublishTopicList = runtimeProperties.getProperty("publishTopicList") + "";
            this.publishTopicList = tempPublishTopicList.split(',');
        }

        this.publishQueueList       = [];

        if (runtimeProperties.getProperty("publishQueueList") instanceof Array) {
            this.publishQueueList = runtimeProperties.getProperty("publishQueueList");
        } else if (runtimeProperties.getProperty("publishQueueList") !== "") {
            var tempPublishQueueList = runtimeProperties.getProperty("publishQueueList") + "";
            this.publishQueueList = tempPublishQueueList.split(',');
        }

        this.xmlSizeList       = [];
        if (runtimeProperties.getProperty("xmlSizeList") instanceof Array) {
            this.xmlSizeList = runtimeProperties.getProperty("xmlSizeList");
        } else if (runtimeProperties.getProperty("xmlSizeList") !== "") {
            var tempXmlSizeList = runtimeProperties.getProperty("xmlSizeList") + "";
            this.xmlSizeList = tempXmlSizeList.split(',');
        }

        this.attachmentSizeList       = [];
        if (runtimeProperties.getProperty("attachmentSizeList") instanceof Array) {
            this.attachmentSizeList = runtimeProperties.getProperty("attachmentSizeList");
        } else if (runtimeProperties.getProperty("attachmentSizeList") !== "") {
            var tempAttachmentSizeList = runtimeProperties.getProperty("attachmentSizeList") + "";
            this.attachmentSizeList = tempAttachmentSizeList.split(',');
        }

        // If both attachmentSizeList and attachmentSizeSweep are defined, the sweep will take priority.
        if (runtimeProperties.getProperty("attachmentSizeSweep") !== "") {

            values = runtimeProperties.getProperty("attachmentSizeSweep").split(',');

            if (values.length !== 3) {
                throw new solace.PubSubError("ERROR: Must specify start,step,end in bytes for msa-sweep: " + values);
            }

            start       = parseInt(values[0], 10);
            step        = parseInt(values[1], 10);
            end         = parseInt(values[2], 10);
            sizeList    = [];

            for (i = start; i <= end; i += step) {
                sizeList.push(i);
            }
            this.attachmentSizeList = sizeList;
        }

        this.publishOrderOffset     = runtimeProperties.getProperty("publishOrderOffset");
        this.publishStreamOffset    = runtimeProperties.getProperty("publishStreamOffset");

        this.deliverToOne           = runtimeProperties.getProperty("deliverToOne");
        this.elidingEligible        = runtimeProperties.getProperty("elidingEligible");

        this.publishReplyTopic      = runtimeProperties.getProperty("publishReplyTopic");
        this.publishReplyPostfix    = runtimeProperties.getProperty("publishReplyPostfix");

        this.classOfService         = runtimeProperties.getProperty("classOfService");

        this.pubAckImmediatelyInterval=runtimeProperties.getProperty("pubAckImmediatelyInterval"); 

        this.wantCrcCheck           = runtimeProperties.getProperty("wantCrcCheck");
        this.wantUserPropToolData   = runtimeProperties.getProperty("wantUserPropToolData");
        this.wantOrderCheck         = runtimeProperties.getProperty("wantOrderCheck");
        this.wantLatency            = runtimeProperties.getProperty("wantLatency");
        this.wantOrderMemory        = runtimeProperties.getProperty("wantOrderCheck");

        this.httpContentEncoding    = runtimeProperties.getProperty("httpContentEncoding");
        this.httpContentType        = runtimeProperties.getProperty("httpContentType");
        this.messageObjectTypeList  = runtimeProperties.getProperty("messageObjectTypeList");

        this.wantTraceCreationContext  = runtimeProperties.getProperty("wantTraceCreationContext");
        this.wantTraceTransportContext = runtimeProperties.getProperty("wantTraceTransportContext");
        this.baggage                   = runtimeProperties.getProperty("baggage");
    };

    solace.PubSubTools.PublishProperties.prototype = solace.PubSubTools.BaseProperties.prototype;


    solace.PubSubTools.StatsProperties = function StatsProperties (runtimeProperties) {

        if (typeof(runtimeProperties) === 'undefined') {
            runtimeProperties = new solace.PubSubTools.RuntimeProperties();
        }

        this.wantLatency            = runtimeProperties.getProperty("wantLatency");
        this.wantCrcCheck           = runtimeProperties.getProperty("wantCrcCheck");
        this.wantOrderCheck         = runtimeProperties.getProperty("wantOrderCheck");
        this.wantUserPropToolData   = runtimeProperties.getProperty("wantUserPropToolData");

        this.wantOrderMemory        = runtimeProperties.getProperty("wantOrderMemory");
        this.latencyNumBuckets      = runtimeProperties.getProperty("latencyNumBuckets");
        this.latencyGranularity     = runtimeProperties.getProperty("latencyGranularity");
        this.latencyWarmupInSec     = runtimeProperties.getProperty("latencyWarmupInSec");
        this.rateStatsInterval      = runtimeProperties.getProperty("rateStatsInterval");
        this.subscriberRateInterval = runtimeProperties.getProperty("subscriberRateInterval");
    };

    solace.PubSubTools.StatsProperties.prototype = solace.PubSubTools.BaseProperties.prototype;


    solace.PubSubTools.StatsProperties.prototype.wantToolData = function () {
        return (this.wantLatency ||
            this.wantCrcCheck ||
            this.wantOrderCheck ||
            this.wantOrderMemory);
    };


    solace.PubSubTools.CacheProperties = function CacheProperties (runtimeProperties) {

        if (typeof(runtimeProperties) === 'undefined') {
            runtimeProperties = new solace.PubSubTools.RuntimeProperties();
        }

        this.topicsList       = [];

        if (runtimeProperties.getProperty("publishTopicList") instanceof Array) {
            this.topicsList = runtimeProperties.getProperty("publishTopicList");
        } else if (runtimeProperties.getProperty("publishTopicList") !== "") {
            var tempPublishTopicList = runtimeProperties.getProperty("publishTopicList") + "";
            this.topicsList = tempPublishTopicList.split(',');
        }

        this.cacheRequestNumber     = runtimeProperties.getProperty("cacheRequestNumber");
        this.cacheRequestRate       = runtimeProperties.getProperty("cacheRequestRate");
    };

    solace.PubSubTools.CacheProperties.prototype = solace.PubSubTools.BaseProperties.prototype;



}.apply(solace.PubSubTools));
