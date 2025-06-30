// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */
var eventEmitter
try {
    eventEmitter = require("events").EventEmitter;
} catch (error) {
    console.log(error);
}
var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {


    // This is a mapping of the property names from solsuite-tools to their
    // javascript equivalents.

    var propertyMap = {
        NUM_CLIENTS:                        "clientNum",
        NUM_PUBS_PER_SESSION:               "",
        PUBLISH_END_DELAY_IN_SEC:           "",
        PUBLISH_RATE_PER_PUB:               "messageRate",
        NUM_MSGS_TO_PUBLISH:                "messageNum",
        XML_PAYLOAD_SIZE_LIST:              "xmlSizeList",
        ATTACHMENT_SIZE_LIST:               "attachmentSizeList",
        CLIENT_IP_ADDR:                     "url",
        CLIENT_USERNAME:                    "userName",
        CLIENT_VPN:                         "vpnName",
        CLIENT_NAME_PREFIX:                 "clientNamePrefix",
        CHANGE_CLIENT_NAMES_FLAG:           "changeClientName",
        CLIENT_PASSWORD:                    "password",
        CLIENT_DESCRIPTION:                 "applicationDescription",
        CLIENT_DTO_LOCAL_PRIORITY:          "",
        CLIENT_DTO_NETWORK_PRIORITY:        "",
        CLIENT_COMPRESSION_LEVEL:           "",
        PAYLOAD_COMPRESSION_LEVEL:           "",
        WANT_TCP_NODELAY:                   "",
        PUBLISH_FILE_LIST:                  "",
        PUBLISH_ATTACH_LIST:                "",
        SMF_BINARY_FILE_LIST:               "",
        SUBSCRIPTION_REFRESH:               "",
        MESSAGE_TYPE:                       "messageDeliveryModeType",  
        PUBLISH_TOPIC_LIST:                 "publishTopicList",
        PUBLISH_QUEUE_LIST:                 "publishQueueList",         
        SELECTOR_LIST:                      "",
        WANT_REMOVE_SUBSCRIBER:             "",
        WANT_SUBSCRIPTION_MEMORY:           "",
        WANT_PER_SUB_THRU_STATS:            "",
        WANT_SUBSCRIPTION_RATE_STATS:       "",
        AD_ACK_EVENT_MODE:                  "adAckEventMode",   
        AD_PUB_WINDOW_SIZE:                 "publishWindow",    
        AD_PUB_ACK_TIMEOUT:                 "publishAckTime",   
        AD_SUB_WINDOW_SIZE:                 "subscribeWindow",		
        AD_SUB_ACK_TIMEOUT:                 "subscribeAckTime",		
        AD_SUB_WINDOW_THRESHOLD:            "subscribeAckThresh",	
        AD_TRANSACTION_SIZE:                "",
        AD_WANT_TRANSACTION_ROLLBACK:       "",
        CID_STATS:                          "",
        WANT_DI_STATS:                      "",
        AD_PUB_MAX_RESEND:                  "",
        WANT_VERBOSE:                       "wantVerbose",          
        WANT_QUIET:                         "",
        WANT_UD:                            "",
        PUB_MESSAGE_TYPE:                   "pubMsgType",
        WANT_SMOOTH_PUB_CALC_LAT:           "",
        WANT_STRUCT_MSG_CHECK:              "wantStructMsgCheck",
        STRUCT_DATA_MSGS_LIST:              "",
        SUB_NOTIFICATION_QUEUE_DEPTH:       "",
        PUBLISH_COS:                        "classOfService",
        PUBLISH_TO_ONE:                     "deliverToOne",
        BURST_DURATION:                     "",
        INTER_BURST_DURATION:               "",
        PUB_SEND_VECT_SIZE:                 "",
        MSG_DMQ_ELIGIBLE:                   "deadMessageQueueEligible",
        MSG_TTL:                            "timeToLiveInMsecs",
        MSG_ELIDING_ELIGIBLE:               "elidingEligible",
        PUB_STREAM_ID_OFFSET:               "publishStreamOffset",
        PUB_ORDER_OFFSET:                   "publishOrderOffset",
        SUBSCRIPTION_CLIENT_NAME:           "",
        MSG_RATE_IS_MAX:                    "",
        IGNORE_EXISTS_ERRORS:               "",
        TRANSACTED_SESSION_NAME:            "",
        PARTITION_KEY_LIST:                 "partitionKeyList",
        HTTP_CONTENT_ENCODING:              "httpContentEncoding",
        HTTP_CONTENT_TYPE:                  "httpContentType",
        MESSAGE_OBJECT_TYPE_LIST:           "messageObjectTypeList",
        MESSAGE_OBJECT_TYPE_CHECK:          "messageObjectTypeCheck",

        // Client Ack parameters.
        WANT_CLIENT_ACK:                    "wantClientAck",            
        CLIENT_ACK_SKIP_NUM:                "clientAckSkipNum",        
        SUB_MSG_QUEUE_DEPTH:                "subMsgQueueDepth",         
        CLIENT_ACK_QUEUE_FLUSH:             "clientAckQueueFlush",      
        CLIENT_ACK_QUEUE_REVERSE:           "clientAckQueueReverse",    
        CLIENT_ACK_RANDOM_DEPTH:            "clientAckRandomDepth",     
        REQUIRED_SETTLEMENTS:               "requiredSettlements",     
        SETTLEMENT_PATTERN:                 "settlementPattern",     

        // Cache parameters.
        CACHE_PROP_NAME:                    "cacheName",
        CACHE_PROP_MAX_MSGS_PER_TOPIC:      "cacheMaxMessages",
        CACHE_PROP_TIMEOUT_IN_MSEC:         "cacheTimeoutInMsecs",
        CACHE_REQ_MSG_RATE:                 "cacheRequestRate",
        CACHE_NUM_REQ:                      "cacheRequestNumber",
        CACHE_PROP_MAX_AGE:                 "cacheMaxAgeInSecs",

        // Destination parameters.
        SUB_DESTINATION_TYPE:               "",
        SUB_XPE_LISTS:                      "",
        SUB_TOPIC_LISTS:                    "subscribeTopicList",
        SUB_DTE_LISTS:                      "subscribeDteList", 
        SUB_QUEUE_LISTS:                    "subscribeQueueList",   
        NUM_TEMP_QUEUE_ENDPOINTS:           "temporaryQueueEndpoints",
        NUM_TEMP_TOPIC_ENDPOINTS:           "temporaryTopicEndpoints",
        WANT_NO_LOCAL:                      "wantNoLocal",

        WANT_PROVISIONED_ENDPOINT:         "wantProvision",
        WANT_MRCS:                         "wantMRCS",
        PE_PERMISSION:                     "permission",
        PE_ACCESS_TYPE:                    "accessType",
        PE_QUOTA_MB:                       "quota",
        PE_MAXMSG_SIZE:                    "maxMessageSize",
        PE_RESPECT_TTL:                    "respectTTL",
        DISCARD_NOTIFY_SENDER:             "discardNotifySender",
        PE_MAX_MSG_REDELIVERY:             "maxMessageRedelivery",

        WANT_VERSIONPRINT:                  "",
        WANT_MESSAGE_EXAMINE_CONTENT:       "",
        WANT_ORDER_CHECK:                   "wantOrderCheck",
        WANT_ORDER_MEMORY:                  "",
        WANT_PAYLOAD_CHECK:                 "wantCrcCheck",
        WANT_PER_MESSAGE_DETAILS:           "wantPerMessageDetails",
        PER_MESSAGE_DETAILS_QUEUE_DEPTH:    "perMessageDetailsQueueDepth",
        OPTION_FILE:                        "",

        // Latency Params
        WANT_LATENCY:                       "",
        WANT_FULL_LATENCY_STATS:            "",
        LATENCY_BUCKETS:                    "",
        LATENCY_GRANULARITY:                "",
        LATENCY_WARMUP_IN_SECS:             "",

        SUBSCRIBER_SUB_DELAY:               "",
        SLOW_SUB_DELAY_COUNT:               "",
        SUBSCRIBER_RATE_INTERVAL:           "subscriberRateInterval",

        // Channel properties
        READ_TIMEOUT_IN_MSEC:               "",
        KEEPALIVE_INTERVAL_MSEC:            "keepAliveIntervalInMsecs",
        RECONNECT_ATTEMPTS:                 "reconnectRetryCount",
        RECONNECT_INTERVAL_MSEC:            "",

        // General Properties
        WANT_CONTEXT_PER_CIENT:             "",
        WANT_STOP_ON_ERROR:                 "",
        EXTRA_PROP_LIST:                    "extraPropsList",
        WANT_MSG_DUMP:                      "wantMessageDump",
        MSG_DUMP_DIR:                       "",
        CLIENT_MODE:                        "clientMode",
        WANT_MSG_REFLECT:                   "",
        WANT_USER_PROP_TOOL_DATA:           "wantUserPropToolData",
        MESSAGE_CALLBACK_ON_REACTOR:        "",
        WANT_REPLY_TOPIC:                   "publishReplyTopic",
        REPLY_TO_POSTFIX:                   "publishReplyPostfix",

        TOOL_MODE:                          "",
        API_MODE:                           "",

        // Web Messaging Specific Properties
        WEB_MESSAGING_TRANSPORT_SCHEME:     "transportProtocol",
        WEB_MESSAGING_MAX_WEB_PAYLOAD:      "maxWebPayload",
        WEB_MESSAGING_SEND_BUFFER_MAX_SIZE: "sendBufferMaxSize",

        // SSL
        AUTHENTICATION_SCHEME:              "authenticationScheme",
        OAUTH_ACCESS_TOKEN:                 "oauthAccessToken",
        OAUTH_ISSUER_ID:                    "oauthIssuerId",
        OAUTH_ID_TOKEN:                     "oauthIdToken",
        SSL_PROTOCOL:                       "sslProtocol",
        SSL_EXCLUDED_PROTOCOL:              "sslExcludedProtocol",
        SSL_MIN_PROTOCOL_VERSION:           "sslMinProtocolVersion",
        SSL_MAX_PROTOCOL_VERSION:           "sslMaxProtocolVersion",
        SSL_VALIDATE_CERTIFICATE:           "sslValidateCertificate",
        SSL_VALIDATE_CERTIFICATE_DATE:      "sslValidateCertificateDate",
        SSL_CIPHER_SUITES:                  "sslCipherSuites",
        SSL_TRUST_STORE:                    "sslTrustStore",
        SSL_TRUSTED_COMMON_NAME_LIST:       "sslTrustedCommonNameList",
        SSL_CERTIFICATE:                    "sslCertificate",
        SSL_PRIVATE_KEY:                    "sslPrivateKey",

        SSL_PFX:                            "sslPfx",
        SSL_PFX_PASSWORD:                   "sslPfxPassword",

        // TRACING
        WANT_TRACE_CONTEXT_PROP:            "wantTraceContextProp",
        WANT_TRACE_CREATION_CONTEXT:        "wantTraceCreationContext",
        WANT_TRACE_TRANSPORT_CONTEXT:       "wantTraceTransportContext",
        BAGGAGE:                            "baggage",
        TRACE_COPY_RECEIVE_CONTEXT:         "traceCopyReceiveContext",
        TRACE_EXPORTER_CONNECTION_STRING:   "traceExporterConnectionString",
        TRACE_EXPORTER_BATCH_SIZE:          "traceExporterBatchSize",
        TRACE_EXPORTER_SCHEDULE_DELAY:      "traceExporterScheduleDelay",
        TRACE_EXPORTER_QUEUE_SIZE:          "traceExporterQueueSize"
    };


    /*
     var defaultValues = {

     // Leave as null where no default is required.  The default are
     // actually defined in web-properties.  This is just a copy from
     // the Java tools.

     NUM_CLIENTS:                        1,
     NUM_PUBS_PER_SESSION:               1,
     PUBLISH_END_DELAY_IN_SEC:           2,
     PUBLISH_RATE_PER_PUB:               1,
     NUM_MSGS_TO_PUBLISH:                0,
     XML_PAYLOAD_SIZE_LIST:              null,
     ATTACHMENT_SIZE_LIST:               null,
     CLIENT_IP_ADDR:                     null,
     CLIENT_USERNAME:                    "",
     CLIENT_VPN:                         "",
     CLIENT_NAME_PREFIX:                 "",
     CHANGE_CLIENT_NAMES_FLAG:           false,
     CLIENT_PASSWORD:                    "",
     CLIENT_DESCRIPTION:                 "",
     CLIENT_DTO_LOCAL_PRIORITY:          null,
     CLIENT_DTO_NETWORK_PRIORITY:        null,
     CLIENT_COMPRESSION_LEVEL:           null,
     PAYLOAD_COMPRESSION_LEVEL:           null,
     WANT_TCP_NODELAY:                   true,
     PUBLISH_FILE_LIST:                  null,
     PUBLISH_ATTACH_LIST:                null,
     SMF_BINARY_FILE_LIST:               null,
     SUBSCRIPTION_REFRESH:               null,
     MESSAGE_TYPE:                       null, 
     PUBLISH_TOPIC_LIST:                 null,
     PUBLISH_QUEUE_LIST:                 null,
     SELECTOR_LIST:                      null,
     WANT_REMOVE_SUBSCRIBER:             true,
     WANT_SUBSCRIPTION_MEMORY:           true,
     WANT_PER_SUB_THRU_STATS:            false,
     WANT_SUBSCRIPTION_RATE_STATS:       false,
     AD_PUB_WINDOW_SIZE:                 50,
     AD_PUB_ACK_TIMEOUT:                 null,
     AD_SUB_WINDOW_SIZE:                 null,
     AD_SUB_ACK_TIMEOUT:                 null,
     AD_SUB_WINDOW_THRESHOLD:            null,
     AD_TRANSACTION_SIZE:                0,
     AD_WANT_TRANSACTION_ROLLBACK:       false,
     CID_STATS:                          false,
     WANT_DI_STATS:                      false,
     AD_PUB_MAX_RESEND:                  null,
     WANT_VERBOSE:                       false,
     WANT_QUIET:                         false,
     WANT_UD:                            false,
     PUB_MESSAGE_TYPE:                   "direct", 
     WANT_SMOOTH_PUB_CALC_LAT:           false,
     WANT_STRUCT_MSG_CHECK:              false,
     STRUCT_DATA_MSGS_LIST:              null,
     SUB_NOTIFICATION_QUEUE_DEPTH:       -1,
     PUBLISH_COS:                        null,
     PUBLISH_TO_ONE:                     null,
     BURST_DURATION:                     0,
     INTER_BURST_DURATION:               0,
     PUB_SEND_VECT_SIZE:                 0,
     MSG_DMQ_ELIGIBLE:                   null,
     MSG_TTL:                            null,
     MSG_ELIDING_ELIGIBLE:               null,
     PUB_STREAM_ID_OFFSET:               -1,
     PUB_ORDER_OFFSET:                   0,
     SUBSCRIPTION_CLIENT_NAME:           "",
     MSG_RATE_IS_MAX:                    false,
     IGNORE_EXISTS_ERRORS:               true,
     SUB_MSG_QUEUE_DEPTH:                0,
     WANT_CLIENT_ACK:                    false,
     TRANSACTED_SESSION_NAME:            [],

     // Destination parameters.
     SUB_DESTINATION_TYPE:               null,
     SUB_XPE_LISTS:                      null,
     SUB_TOPIC_LISTS:                    null,
     SUB_DTE_LISTS:                      null,
     SUB_QUEUE_LISTS:                    null,
     NUM_TEMP_QUEUE_ENDPOINTS:           0,
     NUM_TEMP_TOPIC_ENDPOINTS:           0,
     WANT_NO_LOCAL:                      false,
     WANT_PROVISIONED_ENDPOINT:          false,

     WANT_VERSIONPRINT:                  false,
     WANT_MESSAGE_EXAMINE_CONTENT:       false,
     WANT_ORDER_CHECK:                   false,
     WANT_ORDER_MEMORY:                  false,
     WANT_PAYLOAD_CHECK:                 false,
     OPTION_FILE:                        null,

     // Latency Params
     WANT_LATENCY:                       false,
     WANT_FULL_LATENCY_STATS:            true,
     LATENCY_BUCKETS:                    1024,
     LATENCY_GRANULARITY:                0,
     LATENCY_WARMUP_IN_SECS:             0.5,

     SUBSCRIBER_SUB_DELAY:               0,
     SLOW_SUB_DELAY_COUNT:               -1,
     SUBSCRIBER_RATE_INTERVAL:           1,

     // Channel properties
     READ_TIMEOUT_IN_MSEC:               null,
     KEEPALIVE_INTERVAL_MSEC:            null,
     RECONNECT_ATTEMPTS:                 null,
     RECONNECT_INTERVAL_MSEC:            null,

     // General Properties
     WANT_CONTEXT_PER_CIENT:             false,
     WANT_STOP_ON_ERROR:                 false,
     EXTRA_PROP_LIST:                    null,  
     WANT_MSG_DUMP:                      50,
     MSG_DUMP_DIR:                       "",
     CLIENT_MODE:                        solace.PubSubTools.ClientModeSelect.SINK.value,
     WANT_MSG_REFLECT:                   false,
     WANT_USER_PROP_TOOL_DATA:           false,
     MESSAGE_CALLBACK_ON_REACTOR:        null,
     WANT_REPLY_TOPIC:                   false,
     REPLY_TO_POSTFIX:                   "",

     TOOL_MODE:                          "SDKPERF",
     API_MODE:                           "JAVASCRIPT",

     // Web Messaging Specific Properties
     WEB_MESSAGING_TRANSPORT_SCHEME:     null,
     WEB_MESSAGING_MAX_WEB_PAYLOAD:      null,
     WEB_MESSAGING_SEND_BUFFER_MAX_SIZE: null
     };
     */


    var defaultValues = {
        accessType:                 undefined,
		activeFlowInd:				false, 
        adAckEventMode:             solace.MessagePublisherAcknowledgeMode.PER_MESSAGE,    
        applicationDescription:     "",
        authenticationScheme:       "" + solace.PubSubTools.AuthenticationSchemeSelect.UNSPECIFIED.value,    
        autoStart:                  false,
        attachmentSizeList:         "",
        attachmentSizeSweep:        "",
        cacheLiveDataAction:        solace.PubSubTools.CacheLiveDataActionSelect.QUEUE.value,
        cacheMaxAgeInSecs:          -1,
        cacheMaxMessages:           -1,
        cacheName:                  "",
        cacheTimeoutInMsecs:        -1,
        cacheRequestNumber:         0,
        cacheRequestRate:           1,
        cacheWantRequestOnSubscribe:  false,
        changeClientName:           false,
        classOfService:             solace.PubSubTools.ClassOfServiceSelect.COS1.value,
        clientMode:                 solace.PubSubTools.ClientModeSelect.SINK.value,
        clientNamePrefix:           "",
        clientNum:                  1,
        userName:                   "",
        connectTimeoutInMsecs:      8000,
        deadMessageQueueEligible:   false,
        deliverToOne:               false,
        discardNotifySender:        "default",
        elidingEligible:            false,
        extraPropsList:              "", 
        keepAliveIntervalInMsecs:   3000,
        keepAliveIntervalsLimit:    3,
        logLevel:                   solace.PubSubTools.LogLevelSelect.INFO.value,
        wantVerbose:                false,  
        maxMessageRedelivery:       undefined,
        maxMessageSize:             undefined,
        maxWebPayload:              1000000,
        messageNum:                 0,
        messageRate:                1,
        messageDeliveryModeType:    solace.PubSubTools.MessageDeliveryModeTypeSelect.DIRECT.value,
        pubMsgType:                 undefined,
        msgPriorityList:            "",
        msgPriorityFlat:            false,
        noSubscriptionRemove:       false,
        vpnName:                    "",
        password:                   "",
        permission:                 "n",
        publishEndDelay:            2,
        publishOrderOffset:         0,
        partitionKeyList:           "",
        httpContentEncoding:        "",
        httpContentType:            "",
        messageObjectTypeList:      "",
        messageObjectTypeCheck:     false,
        publishReplyPostfix:        "",
        publishReplyTopic:          false,
        publishStreamOffset:        -1,
        publishQueueList:           "",         
        publishTopicList:           "",
        quota:                      undefined,
        readTimeoutInMsecs:         10000,
        reapplySubscriptions:       true,
        remoteLogServer:            "",
        reconnectRetryCount:        20,
        reconnectRetryIntervalInMs: 3000,
        respectTTL:                 false,
        sendBufferMaxSize:          65536,
        oauthAccessToken:           "",         
        oauthIssuerId:              "",         
        oauthIdToken:               "",         
        sslCertificate:             "",         
        sslCipherSuites:            "",
        sslExcludedProtocols:       "",
        sslMinProtocolVersion:      "",
        sslMaxProtocolVersion:      "",
        sslPrivateKey:              "",
        sslPrivateKeyPassword:      "",
        sslProtocol:                "" + solace.PubSubTools.SslProtocolSelect.UNSPECIFIED.value,
        sslTrustedCommonNameList:   "",
        sslTrustStores:             "",
        sslValidateCertificate:     false,
        sslValidateCertificateDate: false,      
        subscribeAckThresh:         60,     // Units: %, Valid: 1-75
        subscribeAckTime:           1000,   // Units: ms Valid: 0-1500
        subscribeWindow:            255,    // Units: count Valid: 0-255.
        subscriberRateInterval:     1,
        subscribeDteList:           "",         
        subscribeQueueList:         "",         
        subscribeTopicList:         "",
        temporaryTopicEndpoints:    0,
        temporaryQueueEndpoints:    0,
        timeToLiveInMsecs:          -1,
        wantClientAck:              false,      
        clientAckSkipNum:           0,          
        subMsgQueueDepth:           0,          
        clientAckQueueFlush:        false,      
        clientAckQueueReverse:      false,      
        clientAckRandomDepth:       0,          
        requiredSettlements:        "",          
        settlementPattern:          "",          
        transportDowngradeTimeoutInMsecs: 10000,
        transportProtocol:          "" + solace.PubSubTools.TransportProtocolSelect.WEB_SOCKET.value,
        url:                        solace.PubSubTools.utils.getHostUrl(),
        wantCrcCheck:               false,
        wantPerMessageDetails:      false,
        perMessageDetailsQueueDepth: 0,
        wantUserPropToolData:       false,
        wantMessageDump:            false,
        wantPrioStats:              false,
        wantNoLocal:                false,
        wantProvision:              false,
        wantMRCS:                   false,
        wantOrderCheck:             false,
        wantStructMsgCheck:         false,
        xmlSizeList:                "",
        sslConnectionDowngradeTo:   solace.PubSubTools.SslConnectionDowngradeToSelect.NONE.value,
        clientCompressionLevel:     -1,
        payloadCompressionLevel:    -1,
        wantReplay:                 false,
        wantReplayFromDate:         "",
        wantReplayFromMsgId:        "",
        flowReconnectAttempts:          -1,
        flowReconnectIntervalInMsecs:   3000,
        eventEmitter:               eventEmitter,
        wantTraceContextProp:       false,
        wantTraceCreationContext:   false,
        wantTraceTransportContext:  false,
        traceCopyReceiveContext:    false,
        traceExporterBatchSize:     5,
        traceExporterScheduleDelay: 100,
        traceExporterQueueSiz:      2048
    };


    solace.PubSubTools.RuntimeProperties = function (properties) {

        var key;

		this.activeFlowInd = {
			label:              "Active flow indication",
            type:               "boolean",
            value:              defaultValues.activeFlowInd,
            description:        "Active flow indication",
            cliOption:          "afi",
            idList:             []
		};
		
        this.adAckEventMode = {
            label:              "Ack Event Mode",
            type:               "select",
            options:            solace.PubSubTools.AdAckEventModeSelect,
            value:              defaultValues.adAckModeEvent,
            description:        "Ack Event Mode (per-message|windowed)",
            cliOption:          "aem",
            idList:             []
        };

        this.applicationDescription = {
            label:              "Application Description",
            type:               "string",
            value:              defaultValues.applicationDescription,
            description:        "A string that uniquely describes the application instance",
            cliOption:          "",
            idList:             []
        };

        this.authenticationScheme = {
            label:              "Authentication Scheme",
            type:               "select",
            options:            solace.PubSubTools.AuthenticationSchemeSelect,
            value:              defaultValues.authenticationScheme,
            description:        "A string representing authentication scheme \"basic\", \"client-certificate\" or \"oauth2\"",
            cliOption:          "as",
            idList:             []
        };

        this.autoStart = {
            label:              "Automatic Start",
            type:               "boolean",
            value:              defaultValues.autoStart,
            description:        "Used in combination with Save/Load link to cause execution to begin automatically.",
            cliOption:          "",
            idList:             []
        };

        this.attachmentSizeList = {
            label:              "Attachment Sizes",
            type:               "string",
            value:              defaultValues.attachmentSizeList,
            description:        "Comma separated size list in bytes for auto-generated binary attachment.",
            cliOption:          "msa",
            idList:             []
        };

        this.attachmentSizeSweep = {
            label:              "Attachment Size Sweep",
            type:               "string",
            value:              defaultValues.attachmentSizeSweep,
            description:        "Where val=start,step,end in bytes for a list of binary attachment sizes.",
            cliOption:          "msas",
            idList:             []
        };

        this.cacheLiveDataAction = {
            label:              "Live Data Action",
            type:               "select",
            options:            solace.PubSubTools.CacheLiveDataActionSelect,
            value:              defaultValues.cacheLiveDataAction,
            description:        "Live Data Action.  One of QUEUE, FULFILL, FLOW_THRU.",
            cliOption:          "chld",
            idList:             []
        };

        this.cacheMaxAgeInSecs = {
            label:              "Max Message Age [s]",
            type:               "number",
            value:              defaultValues.cacheMaxAgeInSecs,
            description:        "Max age for cached messages in secs.",
            cliOption:          "chpa",
            idList:             []
        };

        this.cacheMaxMessages = {
            label:              "Max Messages Per Topic",
            type:               "number",
            value:              defaultValues.cacheMaxMessages,
            description:        "Max messages returned per topic.",
            cliOption:          "chpm",
            idList:             []
        };

        this.cacheName = {
            label:              "Cache Name",
            type:               "string",
            value:              defaultValues.cacheName,
            description:        "Name of cache for requests.",
            cliOption:          "chpn",
            idList:             []
        };

        this.cacheTimeoutInMsecs = {
            label:              "Request Timeout [ms]",
            type:               "number",
            value:              defaultValues.cacheTimeoutInMsecs,
            description:        "Timeout in msec for a given cache request.",
            cliOption:          "chpt",
            idList:             []
        };

        this.cacheRequestNumber = {
            label:              "Request Number",
            type:               "number",
            value:              defaultValues.cacheRequestNumber,
            description:        "Request number.  How many requests to send at the rate specified.",
            cliOption:          "chrn",
            idList:             []
        };

        this.cacheRequestRate = {
            label:              "Request Rate",
            type:               "number",
            value:              defaultValues.cacheRequestRate,
            description:        "Request rate (msgs/sec).",
            cliOption:          "chrr",
            idList:             []
        };

        this.cacheWantRequestOnSubscribe = {
            label:              "Request on Subscribe",
            type:               "boolean",
            value:              defaultValues.cacheWantRequestOnSubscribe,
            description:        "Want Request on Subscribe - Tool will perform cache request.",
            cliOption:          "chrs",
            idList:             []
        };

        this.changeClientName = {
            label:              "Change Client Name",
            type:               "boolean",
            value:              defaultValues.changeClientName,
            description:        "Flag to change client names following reconnect. Rather than correctly setting them on connect.",
            cliOption:          "ccn",
            idList:             []
        };

        this.classOfService = {
            label:              "Class of Service",
            type:               "select",
            options:            solace.PubSubTools.ClassOfServiceSelect,
            value:              defaultValues.classOfService,
            description:        "The cos value to use in publishing.  Valid range (COS1..COS3) or unspecified in API.",
            cliOption:          "cos",
            idList:             []
        };

        this.clientMode = {
            label:              "Client Mode",
            type:               "select",
            options:            solace.PubSubTools.ClientModeSelect,
            value:              defaultValues.clientMode,
            description:        "Client mode.  One of 'reply' or 'sink'.  Default is 'sink'.  In reply, all messages are reflected by the replyTo topic is used as the destination when sending.",
            cliOption:          "cm",
            idList:             []
        };

        this.clientNamePrefix = {
            label:              "Client Name Prefix",
            type:               "string",
            value:              defaultValues.clientNamePrefix,
            description:        "Root name for clients, index appended (e.g. perf_client0001, perf_client0002, ...)",
            cliOption:          "cn",
            idList:             []
        };

        this.clientNum = {
            label:              "Number of Clients",
            type:               "number",
            value:              defaultValues.clientNum,
            description:        "Number of client connections",
            cliOption:          "cc",
            idList:             []
        };

        this.userName = {
            label:              "Client Username",
            type:               "string",
            value:              defaultValues.userName,
            description:        "Client username used to connect to the router",
            cliOption:          "cu",
            idList:             []
        };

        this.connectTimeoutInMsecs = {
            label:              "Connect Timeout [ms]",
            type:               "number",
            value:              defaultValues.connectTimeoutInMsecs,
            description:        "The timeout period (in milliseconds) for a connect operation to a given host.",
            cliOption:          "",
            idList:             []
        };

        this.deliverToOne = {
            label:              "Deliver To One",
            type:               "boolean",
            value:              defaultValues.deliverToOne,
            description:        "Publish to one.  Flag to have publisher set deliver to one field.",
            cliOption:          "pto",
            idList:             []
        };

        this.elidingEligible = {
            label:              "Eliding Eligible",
            type:               "boolean",
            value:              defaultValues.elidingEligible,
            description:        "Messages should be flagged eligible for message eliding.",
            cliOption:          "mee",
            idList:             []
        };

        this.deadMessageQueueEligible = {
            label:              "Dead Message Queue Eligible",
            type:               "boolean",
            value:              defaultValues.deadMessageQueueEligible,
            description:        "Messages should be flagged eligible for the dead message queue.",
            cliOption:          "mdq",
            idList:             []
        };

        this.timeToLiveInMsecs = {
            label:              "Time To Live [ms]",
            type:               "number",
            value:              defaultValues.timeToLiveInMsecs,
            description:        "Messages will be tagged with time to live (millis) of this value",
            cliOption:          "mtl",
            idList:             []
        };

        this.msgPriorityList = {
            label:              "Pairs of Message Priority [0-255], probablility [0-100]",
            type:               "string",
            value:              defaultValues.msgPriorityList,
            description:        "Desired probablility distribution of published message priorities. "+
          "Probability of not setting a priority at all = 100 - sum(probabilities).",
            cliOption:          "pmpl",
            idList:             []
        };

        this.msgPriorityFlat = {
            label:              "Flat message priority distribution between [0-9]",
            type:               "boolean",
            value:              defaultValues.msgPriorityFlat,
            description:        "Equivalent to -pmpl=0,10,1,10,2,10,3,10,4,10,5,10,6,10,7,10,8,10,9,10.",
            cliOption:          "pmp",
            idList:             []
        };

        //this.msgPriorityStats = {
        this.wantPrioStats = {
            label:              "Message Priority stats",
            type:               "boolean",
            value:              defaultValues.wantPrioStats,
            description:        "Message Priority Stats will be tracked and printed on exit.",
            cliOption:          "mps",
            idList:             []
        };

        this.keepAliveIntervalInMsecs = {
            label:              "Keep Alive Interval [ms]",
            type:               "number",
            value:              defaultValues.keepAliveIntervalInMsecs,
            description:        "Keepalive interval in milliseconds",
            cliOption:          "ka",
            idList:             []
        };

        this.keepAliveIntervalsLimit = {
            label:              "Keep Alive Interval Limit",
            type:               "number",
            value:              defaultValues.keepAliveIntervalsLimit,
            description:        "The maximum number of consecutive Keep-Alive messages.",
            cliOption:          "",
            idList:             []
        };

        this.logLevel = {
            label:              "Log Level",
            type:               "select",
            options:            solace.PubSubTools.LogLevelSelect,
            value:              defaultValues.logLevel,
            description:        "Set the log level.  Solclientjs Library must be set to solclientjs-debug to enable logging.  (API logs appear in the javascript console of the browser.)",
            cliOption:          "log",
            idList:             []
        };

        this.wantVerbose = {
            label:              "Want Verbose",
            type:               "boolean",
            value:              defaultValues.wantVerbose,
            description:        "Enable debug information.",
            cliOption:          "d",
            idList:             []
        };

        this.maxWebPayload = {
            label:              "Max Web Payload",
            type:               "number",
            value:              defaultValues.maxWebPayload,
            description:        "The maximum payload size (in bytes) when sending data using the Web transport.",
            cliOption:          "",
            idList:             []
        };

        this.messageNum = {
            label:              "Number of Messages",
            type:               "number",
            value:              defaultValues.messageNum,
            description:        "Total # messages to publish (across ALL clients)  (default is 0)",
            cliOption:          "mn",
            idList:             []
        };

        this.messageRate = {
            label:              "Message Rate",
            type:               "float",
            value:              defaultValues.messageRate,
            description:        "Publishing rate (msg/sec per client) (default 1)",
            cliOption:          "mr",
            idList:             []
        };

        this.messageDeliveryModeType = {
            label:              "Message Delivery Mode Type",
            type:               "select",
            options:            solace.PubSubTools.MessageDeliveryModeTypeSelect,
            value:              defaultValues.messageDeliveryModeType,
            description:        "Message delivery mode type (direct|persistent|nonpersistent) (default direct)",
            cliOption:          "mt",
            idList:             []
        };

        this.pubMsgType = {
            label:              "Publish Message Delivery Mode Type",
            type:               "select",
            options:            solace.PubSubTools.MessageDeliveryModeTypeSelect,
            value:              defaultValues.pubMsgType,
            description:        "Publish Message delivery mode type (direct|persistent|nonpersistent) (default direct)",
            cliOption:          "",
            idList:             []
        };
		
		this.noSubscriptionRemove = {
			label:              "No subscription remove",
            type:               "boolean",
            value:              defaultValues.noSubscriptionRemove,
            description:        "No subscription remove. Flag to indicate that sdkperf should not remove subscriptions on exit",
            cliOption:          "nsr",
            idList:             []
		};

        this.extraPropsList = {
            label:              "Extra Properties List",
            type:               "string",
            value:              defaultValues.extraPropsList,
            description:        "Extra properties list (comma delimited key value pairs) (default blank)",
            cliOption:          "epl",
            idList:             []
        };

        this.vpnName = {
            label:              "Message VPN",
            type:               "string",
            value:              defaultValues.vpnName,
            description:        "Message VPN of client username",
            cliOption:          "",
            idList:             []
        };

        this.password = {
            label:              "Password",
            type:               "string",
            value:              defaultValues.password,
            description:        "Client password",
            cliOption:          "cp",
            idList:             []
        };

        this.pubAckImmediatelyInterval = {
            label:              "Publish Ack Immediately Interval",
            type:               "number",
            value:              defaultValues.pubAckImmediatelyInterval,
            description:        "Publish Ack Immediately Interval",
            cliOption:          "aii",
            idList:             []
        };

        this.publishAckTime = {
            label:              "Publisher Ack Timeout",
            type:               "number",
            value:              defaultValues.publishAckTime,
            description:        "Publisher Ack Timeout in ms.",
            cliOption:          "apa",
            idList:             []
        }

        this.publishEndDelay = {
            label:              "Publish End Delay",
            type:               "number",
            value:              defaultValues.publishEndDelay,
            description:        "Publish end delay. The time in seconds to wait following publishing the final message before bringing down subscriber data channels.  (Default 2 secs)",
            cliOption:          "ped",
            idList:             []
        };

        this.publishOrderOffset = {
            label:              "Publish Order Offset",
            type:               "number",
            value:              defaultValues.publishOrderOffset,
            description:        "Publish order offset.  Add this offset to order Ids of outgoing messages.",
            cliOption:          "poo",
            idList:             []
        };

        this.partitionKeyList = {
            label:              "Partition Key List",
            type:               "string",
            value:              defaultValues.partitionKeyList,
            description:        "Partition Key List, comma separated list of keys to be looped through when publishing messages.",
            cliOption:          "pkl",
            idList:             []
        };

        this.httpContentEncoding = {
            label:              "HTTP Content Encoding",
            type:               "string",
            value:              defaultValues.httpContentEncoding,
            description:        "Http Content Encoding.",
            cliOption:          "httpce",
            idList:             []
        };
        this.httpContentType = {
            label:              "HTTP Content Type",
            type:               "string",
            value:              defaultValues.httpContentType,
            description:        "Http Content Type.",
            cliOption:          "httpct",
            idList:             []
        };

        this.messageObjectTypeList = {
            label:              "Message Object Type Pattern",
            type:               "string",
            value:              defaultValues.messageObjectTypeList,
            description:        "Message Object Type, creates small, canned messages of the given type instead of using message size. Can be used in a pattern, Eg. -mot=btsm\nValid options are b - bytes, t - text, s - stream, m - map.",
            cliOption:          "mot",
            idList:             []
        };

        this.messageObjectTypeCheck = {
            label:              "Message Object Type Check",
            type:               "boolean",
            value:              defaultValues.messageObjectTypeCheck,
            description:        "Message Object Type Check, verifies messages sent with -mot are the expected type/content.",
            cliOption:          "motc",
            idList:             []
        };

        this.publishReplyPostfix = {
            label:              "Publish Reply Postfix",
            type:               "string",
            value:              defaultValues.publishReplyPostfix,
            description:        "Publish reply postfix.  Similar to -prt except pub will add publish topic + this postfix as reply to.",
            cliOption:          "prp",
            idList:             []
        };

        this.publishReplyTopic = {
            label:              "Publish Reply Topic",
            type:               "boolean",
            value:              defaultValues.publishReplyTopic,
            description:        "Publish reply topic flag. Pubs will add reply to topic in each send.  P2P by default.",
            cliOption:          "prt",
            idList:             []
        };

        this.publishStreamOffset = {
            label:              "Publish Stream Offset",
            type:               "number",
            value:              defaultValues.publishStreamOffset,
            description:        "Publish stream offset.  Add stream Ids to outgoing messages using this offset.",
            cliOption:          "pso",
            idList:             []
        };

        this.publishQueueList = {
            label:              "Publish Queue List",
            type:               "string",
            value:              defaultValues.publishQueueList,
            description:        "Comma separated list of queues for publishing.",
            cliOption:          "pql",
            idList:             []
        };

        this.publishTopicList = {
            label:              "Publish Topic List",
            type:               "string",
            value:              defaultValues.publishTopicList,
            description:        "Comma separated list of topics for publishing.  Note: This list must be either of size 1 (same topic used for all msgs) or of equal length to message parts specified (topics uniquely specified).",
            cliOption:          "ptl",
            idList:             []
        };

        this.publishWindow = {
            label:              "Publisher Window Size",
            type:               "number",
            value:              defaultValues.publishWindow,
            description:        "Publisher window size.",
            cliOption:          "apw",
            idList:             []
        };

        this.readTimeoutInMsecs = {
            label:              "Read Timeout [ms]",
            type:               "number",
            value:              defaultValues.readTimeoutInMsecs,
            description:        "The timeout period (in milliseconds) for a reply to come back from the router.",
            cliOption:          "",
            idList:             []
        };

        this.reapplySubscriptions = {
            label:              "Reapply Subscription",
            type:               "boolean",
            value:              defaultValues.reapplySubscriptions,
            description:        "Enable subscription reapply on reconnect",
            cliOption:          "",
            idList:             []
        };

        this.remoteLogServer = {
            label:              "Remote Log Server",
            type:               "string",
            value:              defaultValues.remoteLogServer,
            description:        "If specified, console logs will also be sent to this server address as a POST.",
            cliOption:          "",
            idList:             []
        };

        this.reconnectRetryCount = {
            label:              "Retry Count",
            type:               "number",
            value:              defaultValues.reconnectRetryCount,
            description:        "Retry Count.  Number of times to try to re-establish a failed connection.",
            cliOption:          "rc",
            idList:             []
        };

        this.reconnectRetryIntervalInMs = {
            label:              "Retry Interval",
            type:               "number",
            value:              defaultValues.reconnectRetryIntervalInMs,
            description:        "Retry Interval.  Interval between successive reconnect attempts (in ms).",
            cliOption:          "rrw",
            idList:             []
        };

        this.sendBufferMaxSize = {
            label:              "Send Buffer Max Size",
            type:               "number",
            value:              defaultValues.sendBufferMaxSize,
            description:        "The maximum buffer size for the transport session. This size must be bigger than the largest message an application intends to send on the session.",
            cliOption:          "sbs",
            idList:             []
        };

        this.oauthAccessToken = {
            label:              "OAuth Access Token",
            type:               "string",
            value:              defaultValues.oauthAccessToken,
            description:        "OAuth Access Token. (b64token encoded)",
            cliOption:          "oaat",
            idList:             []
        };
        this.oauthIssuerId = {
            label:              "OAuth Issuer Identifier",
            type:               "string",
            value:              defaultValues.oauthIssuerId,
            description:        "OAuth Issuer Identifier",
            cliOption:          "oaii",
            idList:             []
        };
        this.oauthIdToken = {
            label:              "OAuth ID Token",
            type:               "string",
            value:              defaultValues.oauthIdToken,
            description:        "OAuth ID Token. (b64token encoded)",
            cliOption:          "oidt",
            idList:             []
        };

        this.sslCertificate = {
            label:              "SSL Certificate",
            type:               "string",
            value:              defaultValues.sslCertificate,
            description:        "The file name of a file containing certificate key of the client in PEM format.",
            cliOption:          "sslcf",
            idList:             []
        };
        this.sslCipherSuites = {
            label:              "SSL Cipher Suites",
            type:               "string",
            value:              defaultValues.sslCipherSuites,
            description:        "A comma separated list of cipher suites in order of preference used for TLS connections",
            cliOption:          "sslcs",
            idList:             []
        };
        this.sslExcludedProtocols = {
            label:              "SSL Excluded Protocols",
            type:               "string",
            value:              defaultValues.sslExcludedProtocols,
            description:        "Comma delimited list of protocols to exclude (values: tlsv1,tlsv1.1,tlsv1.2,tlsv1.3)",
            cliOption:          "sslep",
            idList:             []
        };
        this.sslPrivateKey = {
            label:              "SSL Private Key",
            type:               "string",
            value:              defaultValues.sslPrivateKey,
            description:        "The file name of a file containing private key of the client in PEM format.",
            cliOption:          "sslpk",
            idList:             []
        };
        this.sslPrivateKeyPassword = {
            label:              "SSL Private Key Password",
            type:               "string",
            value:              defaultValues.sslPrivateKeyPassword,
            description:        "A string containg password for the client private key.",
            cliOption:          "sslpkp",
            idList:             []
        };
        this.sslProtocol = {
            label:              "SSL Protocol",
            type:               "select",
            options:            solace.PubSubTools.SslProtocolSelect,
            value:              defaultValues.sslProtocol,
            description:        "Force it to use this protocol. The others will be excluded. (values: tlsv1,tlsv1.1,tlsv1.2,tlsv1.3)",
            cliOption:          "sslp",
            idList:             []
        };
        this.sslMinProtocolVersion = {
            label:              "Min SSL Protocol Version",
            type:               "select",
            options:            solace.PubSubTools.SslProtocolSelect,
            value:              defaultValues.sslMinProtocolVersion,
            description:        "Minimum SSL protocol to negotiate with the broker. (values: tlsv1,tlsv1.1,tlsv1.2,tlsv1.3)",
            cliOption:          "sslmin",
            idList:             []
        };
        this.sslMaxProtocolVersion = {
            label:              "Max SSL Protocol Version",
            type:               "select",
            options:            solace.PubSubTools.SslProtocolSelect,
            value:              defaultValues.sslMaxProtocolVersion,
            description:        "Maximum SSL protocol to negotiate with the broker. (values: tlsv1,tlsv1.1,tlsv1.2,tlsv1.3)",
            cliOption:          "sslmax",
            idList:             []
        };
        this.sslTrustedCommonNameList = {
            label:              "SSL Trusted Common Name List",
            type:               "string",
            value:              defaultValues.sslTrustedCommonNameList,
            description:        "A comma seperated list of acceptable common names for matching with the server certificate.",
            cliOption:          "ssltcn",
            idList:             []
        };
        this.sslTrustStores = {
            label:              "SSL Trust Stores",
            type:               "string",
            value:              defaultValues.sslTrustStores,
            description:        "A comma seperated list of file names of trusted certificates in PEM format.",
            cliOption:          "sslts",
            idList:             []
        };
        this.sslValidateCertificate = {
            label:              "SSL Validate Certificate",
            type:               "boolean",
            value:              defaultValues.sslValidateCertificate,
            description:        "Enable certificate validation",
            cliOption:          "sslvc",
            idList:             []
        };
        this.sslValidateCertificateDate = {
            label:              "SSL Validate Certificate Date",
            type:               "boolean",
            value:              defaultValues.sslValidateCertificateDate,
            description:        "Enable certificate date validation",
            cliOption:          "sslvcd",
            idList:             []
        };

        this.subscriberRateInterval = {
            label:              "Subscriber Rate Interval",
            type:               "number",
            value:              defaultValues.subscriberRateInterval,
            description:        "Subscriber rate interval.  A method of controlling how often the subscriber calculates throughput.  The subscriber will calculate rate every sri messages.  (default 1) Use -1 to disable rate checking.",
            cliOption:          "sri",
            idList:             []
        };

        this.subscribeDteList = {
            label:              "Subscribe DTE List",
            type:               "string",
            value:              defaultValues.subscribeDteList,
            description:        "Comma separated list of DTE for subscribing, applied round robin to clients",
            cliOption:          "sdl",
            idList:             []
        };

        this.subscribeQueueList = {
            label:              "Subscribe Queue List",
            type:               "string",
            value:              defaultValues.subscribeQueueList,
            description:        "Comma separated list of queues for subscribing, applied round robin to clients",
            cliOption:          "sql",
            idList:             []
        };

        this.subscribeTopicList = {
            label:              "Subscribe Topic List",
            type:               "string",
            value:              defaultValues.subscribeTopicList,
            description:        "Comma separated list of topics for subscribing, applied round robin to clients",
            cliOption:          "stl",
            idList:             []
        };

        this.temporaryTopicEndpoints = {
            label:              "Temp Topic Endpoints",
            type:               "number",
            value:              defaultValues.temporaryTopicEndpoints,
            description:        "Number of temporary topic endpoints to create per client",
            cliOption:          "tte",
            idList:             []
        };

        this.temporaryQueueEndpoints = {
            label:              "Temp Queue Endpoints",
            type:               "number",
            value:              defaultValues.temporaryQueueEndpoints,
            description:        "Number of temporary queue endpoints to create per client",
            cliOption:          "tqe",
            idList:             []
        };

        this.subscribeWindow = {
            label:              "Subscriber Window Size",
            type:               "number",
            value:              defaultValues.subscribeWindow,
            description:        "Subscriber window size.",
            cliOption:          "asw",
            idList:             []
        };
		
        this.subscribeAckTime = {
            label:              "Subscriber Acknowledge Time",
            type:               "number",
            value:              defaultValues.subscribeAckTime,
            description:        "Subscriber Acknowledge Time (ms).",
            cliOption:          "asa",
            idList:             []
        };
		
        this.subscribeAckThresh = {
            label:              "Subscriber Acknowledge Window Threshold",
            type:               "number",
            value:              defaultValues.subscribeAckThresh,
            description:        "Subscriber Acknowledge Window Threshold (%).",
            cliOption:          "awt",
            idList:             []
        };

        this.wantClientAck = {
            label:              "Want Client Ack",
            type:               "boolean",
            value:              defaultValues.wantClientAck,
            description:        "Want Client Ack. Enable client ack for all GD msgs (default auto ack)",
            cliOption:          "ca",
            idList:             []
        };

        this.clientAckSkipNum = {
            label:              "Client Ack Skip Num",
            type:               "number",
            value:              defaultValues.clientAckSkipNum,
            description:        "Client Ack Skip Num. Skip this many messages during client ack",
            cliOption:          "cask",
            idList:             []
        };

        this.subMsgQueueDepth = {
            label:              "Subscriber Msg Queue Depth",
            type:               "number",
            value:              defaultValues.subMsgQueueDepth,
            description:        "Subscriber Msg Queue Depth. Queue size for buffering of msgs before processing them for client acks",
            cliOption:          "caq",
            idList:             []
        };

        this.clientAckQueueFlush = {
            label:              "Client Ack Queue Flush",
            type:               "boolean",
            value:              defaultValues.clientAckQueueFlush,
            description:        "Client Ack Queue Flush. When queue is full ack all messages in the queue (ie burst acks)",
            cliOption:          "caf",
            idList:             []
        };

        this.clientAckQueueReverse = {
            label:              "Client Ack Queue Reverse",
            type:               "boolean",
            value:              defaultValues.clientAckQueueReverse,
            description:        "Client Ack Queue Reverse. Same as -caf but process the queue in reverse order.",
            cliOption:          "cafr",
            idList:             []
        };
        
        this.clientAckRandomDepth = {
            label:              "Client Ack Random Depth",
            type:               "number",
            value:              defaultValues.clientAckRandomDepth,
            description:        "Client Ack Random Depth. When processing ack queue, choose a message at random up to this value.  The larger this value the larger the perf impact of using this option",
            cliOption:          "car",
            idList:             []
        };

        this.requiredSettlements = {
            label:              "Required Settlements",
            type:               "string",
            value:              defaultValues.requiredSettlements,
            description:        "Required Settlements to be enabled on each flow. Accepted Values: a - Accepted, r - Rejected, f - Failed.",
            cliOption:          "rsp",
            idList:             []
        };

        this.settlementPattern = {
            label:              "Settlement Pattern",
            type:               "string",
            value:              defaultValues.settlementPattern,
            description:        "Settlement Pattern to be used by each flow. Pattern repeats after it has been traversed. Pattern Values: a - Accepted, r - Rejected, f - Failed. (Eg. -sp=faraaa)",
            cliOption:          "sp",
            idList:             []
        };
        
        this.transportDowngradeTimeoutInMsecs = {
            label:              "Transport Downgrade Timeout [ms]",
            type:               "number",
            value:              defaultValues.transportDowngradeTimeoutInMsecs,
            description:        "The timeout period (in milliseconds) for an attempt to use a single transport method to connect to a given host.",
            cliOption:          "",
            idList:             []
        };

        this.transportProtocol = {
            label:              "Transport Protocol",
            type:               "select",
            value:              defaultValues.transportProtocol,
            options:            solace.PubSubTools.TransportProtocolSelect,
            description:        "Force a given transport protocol.  By default, the API is left to decide.",
            cliOption:          "",
            idList:             []
        };

        this.url = {
            label:              "URL",
            type:               "string",
            value:              defaultValues.url,
            description:        "URL of the client router (according to proxy configuration).",
            cliOption:          "cip",
            idList:             []
        };

        this.wantCrcCheck = {
            label:              "CRC Checking",
            type:               "boolean",
            value:              defaultValues.wantCrcCheck,
            description:        "Enable CRC-32 check of message payload.",
            cliOption:          "crc",
            idList:             []
        };

        this.wantPerMessageDetails = {
            label:              "Want Per Message Details",
            type:               "boolean",
            value:              defaultValues.wantPerMessageDetails,
            description:        "Enable per message details tracking on message receive.",
            cliOption:          "",
            idList:             []
        };

        this.perMessageDetailsQueueDepth = {
            label:              "Per Message Details Queue Depth",
            type:               "number",
            value:              defaultValues.perMessageDetailsQueueDepth,
            description:        "Number of last message details to keep in queue.",
            cliOption:          "",
            idList:             []
        };

        this.wantUserPropToolData = {
            label:              "Tool Data in User Property Map",
            type:               "boolean",
            value:              defaultValues.wantUserPropToolData,
            description:        "Tool data is contained in the user property map rather than the binary attachment.",
            cliOption:          "upt",
            idList:             []
        };

        this.wantMessageDump = {
            label:              "Message Dump",
            type:               "boolean",
            value:              defaultValues.wantMessageDump,
            description:        "Dump all received messages to the screen as text.",
            cliOption:          "md",
            idList:             []
        };

        this.wantOrderCheck = {
            label:              "Order Checking",
            type:               "boolean",
            value:              defaultValues.wantOrderCheck,
            description:        "Enable order checking on clients.",
            cliOption:          "oc",
            idList:             []
        };

        this.wantStructMsgCheck = {
            label:              "Struct Msg Checking",
            type:               "boolean",
            value:              defaultValues.wantStructMsgCheck,
            description:        "Enable struct msg checking on clients.",
            cliOption:          "smc",
            idList:             []
        };

        this.xmlSizeList = {
            label:              "XML Payload Sizes",
            type:               "string",
            value:              defaultValues.xmlSizeList,
            description:        "Comma separated size list in bytes for auto-generated xml payload portion.",
            cliOption:          "msx",
            idList:             []
        };


        this.permission = {
            label:              "Permissions",
            type:               "string",
            value:              defaultValues.permission,
            description:        "Provisioned Endpoints Permissions. One of (n)one, (r)eadonly, (c)onsume, (m)odify, (d)elete",
            cliOption:          "pep",
            idList:             []
        };
        
        this.accessType = {
            label:              "Access Type",
            type:               "number",
            value:              defaultValues.accessType,
            description:        "Provisioned Endpoints Access Type. 0 for Non Exclusive, 1 for Exclusive",
            cliOption:          "pea",
            idList:             []
        };

        this.quota = {
            label:              "Quota in MB",
            type:               "number",
            value:              defaultValues.quota,
            description:        "Provisioned Endpoints Quota in MB",
            cliOption:          "peq",
            idList:             []
        };

        this.maxMessageSize = {
            label:              "Max Message Size in bytes",
            type:               "number",
            value:              defaultValues.maxMessageSize,
            description:        "Provisioned Endpoints Max Message Size in bytes",
            cliOption:          "pem",
            idList:             []
        };

        this.maxMessageRedelivery = {
            label:              "Max Message Redelivery.",
            type:               "number",
            value:              defaultValues.maxMessageRedelivery,
            description:        "Provisioned Endpoints Max Message Redelivery. 0 means retry forever.",
            cliOption:          "pemr",
            idList:             []
        };

        this.respectTTL = {
            label:              "Respect TTL",
            type:               "boolean",
            value:              defaultValues.respectTTL,
            description:        "Provisioned Endpoints Respect TTL flag.",
            cliOption:          "per",
            idList:             []
        };

        this.discardNotifySender = {
            label:              "Discard Notify Sender",
            type:               "string",
            value:              defaultValues.discardNotifySender,
            description:        "Provisioned Endpoints Discard Notify Sender flag. 'default', 'on', 'off'",
            cliOption:          "pedn",
            idList:             []
        };

        this.wantNoLocal = {
            label:              "No Local",
            type:               "boolean",
            value:              defaultValues.wantNoLocal,
            description:        "Client No Local on session and all endpoints.  (default false)",
            cliOption:          "cnl",
            idList:             []
        };

        this.wantProvision = {
            label:              "Provision Endpoints",
            type:               "boolean",
            value:              defaultValues.wantProvision,
            description:        "Enables provisioning of queues and topic endpoints (default false)",
            cliOption:          "pe",
            idList:             []
        };

        this.wantMRCS = {
            label:              "Missing Resource Creation Strategy",
            type:               "boolean",
            value:              defaultValues.wantMRCS,
            description:        "Creates message consumers with the createIfMissing flag (default false)",
            cliOption:          "mrcs",
            idList:             []
        };

        this.eventEmitter = {
            label:              "Client EventEmitter Object",
            type:               "object",
            value:              defaultValues.eventEmitter,
            description:        "Client EventEmitter Object to notify client collection when an action is completed for the client",
            cliOption:          "",
            idList:             []
        };

        this.sslConnectionDowngradeTo = {
            label:              "SSL/TLS Connection Downgrade To",
            type:               "select",
            value:              defaultValues.sslConnectionDowngradeTo,
            options:            solace.PubSubTools.SslConnectionDowngradeToSelect,
            description:        "The transport protocol that the connection will be downgraded to after client authentication (default: API default -- do not downgrade; accepted value: PLAIN_TEXT)",
            cliOption:          "sslcd",
            idList:             []
        };

        this.clientCompressionLevel = {
            label:              "Client Compression Level",
            type:               "number",
            value:              defaultValues.clientCompressionLevel,
            description:        "Enable compression. (1..9) 1 is fastest, 9 max compression.",
            cliOption:          "z",
            idList:             []
        };

        this.payloadCompressionLevel = {
            label:              "Payload Compression Level",
            type:               "number",
            value:              defaultValues.payloadCompressionLevel,
            description:        "Enable payload compression. (1..9) 1 is fastest, 9 max compression.",
            cliOption:          "pz",
            idList:             []
        };

        this.wantReplay = {
            label:              "Message Replay",
            type:               "boolean",
            value:              defaultValues.wantReplay,
            description:        "Request replay when creating subscriber flow(s). If no date is provided (-fdr) then replay will be requested from beginning of replay log.",
            cliOption:          "fr",
            idList:             []
        };

        this.wantReplayFromDate = {
            label:              "Message Replay From Date",
            type:               "string",
            value:              defaultValues.wantReplayFromDate,
            description:        "Request replay from provided date when creating subscriber flow(s). (e.g. 2018-07-30T10:00:00-04:00)",
            cliOption:          "fdr",
            idList:             []
        };

        this.wantReplayFromMsgId = {
            label:              "Message Replay From Replication Group Message Id",
            type:               "string",
            value:              defaultValues.wantReplayFromMsgId,
            description:        "Request replay from provided replication message id when creating subscriber flow(s). (e.g. rmid1:0117b-75462900ca8-00000000-00135082)",
            cliOption:          "fmidr",
            idList:             []
        };

        this.flowReconnectAttempts = {
            label:              "Flow reconnect count",
            type:               "number",
            value:              defaultValues.flowReconnectAttempts,
            description:        "Number of times to attempt to reconnect to an endpoint after a flow goes down. Default -1: infinite times; 0: no retry.",
            cliOption:          "frc",
            idList:             []
        };

        this.flowReconnectIntervalInMsecs = {
            label:              "Flow reconnect try interval",
            type:               "number",
            value:              defaultValues.flowReconnectIntervalInMsecs,
            description:        "Interval (in milliseconds) between each flow reconnect try, default 3000ms.",
            cliOption:          "fri",
            idList:             []
        };

        this.wantTraceContextProp = {
            label:              "Want Trace Context Prop",
            type:               "boolean",
            value:              defaultValues.wantTraceContextProp,
            description:        "",
            cliOption:          "",
            idList:             []
        };
        this.wantTraceCreationContext = {
            label:              "Want Trace Creation Context",
            type:               "boolean",
            value:              defaultValues.wantTraceCreationContext,
            description:        "Inject creation context with pre-defined values for trace ID, sampled ID, trace state and sampled flag to published messages and generate/export spans at the same time.",
            cliOption:          "tcc",
            idList:             []
        };
        this.wantTraceTransportContext = {
            label:              "Want Trace Transport Context",
            type:               "boolean",
            value:              defaultValues.wantTraceTransportContext,
            description:        "Inject transport context with pre-defined values for trace ID, sampled ID, trace state and sampled flag to published messages and generate/export spans at the same time.",
            cliOption:          "ttc",
            idList:             []
        };
        this.baggage = {
            label:              "Baggage",
            type:               "string",
            value:              defaultValues.baggage,
            description:        "Creation context injected into messages will have specified baggage, Format: \"key1=val1,key2=val2\" (Default: Empty).",
            cliOption:          "bag",
            idList:             []
        };
        this.traceCopyReceiveContext = {
            label:              "Want Trace Copy Receive Context",
            type:               "boolean",
            value:              defaultValues.traceCopyReceiveContext,
            description:        "Copy receive context into a new span to be exported.",
            cliOption:          "tcrc",
            idList:             []
        };
        this.traceExporterConnectionString = {
            label:              "Trace Exporter Connection String",
            type:               "string",
            value:              defaultValues.traceExporterConnectionString,
            description:        "Trace Exporter Connection String, point to a OTLP receiver for spans generated via -tcc, -ttc, or -tcrc. Example: \"http://192.168.0.1:4317\"",
            cliOption:          "tecip",
            idList:             []
        };
        this.traceExporterBatchSize = {
            label:              "Trace Exporter Batch Size",
            type:               "number",
            value:              defaultValues.traceExporterBatchSize,
            description:        "Trace Exporter Batch Size. (Default: 5).",
            cliOption:          "tebs",
            idList:             []
        };
        this.traceExporterScheduleDelay = {
            label:              "Trace Exporter Schedule Delay",
            type:               "number",
            value:              defaultValues.traceExporterScheduleDelay,
            description:        "Trace Exporter Schedule Delay in millisecond. (Default: 100ms).",
            cliOption:          "tesd",
            idList:             []
        };
        this.traceExporterQueueSize = {
            label:              "Trace Exporter Queue Size",
            type:               "number",
            value:              defaultValues.traceExporterQueueSize,
            description:        "Trace Exporter Queue Size. (Default: 2048).",
            cliOption:          "teqs",
            idList:             []
        };

        // If a set of properties was provided, overwrite the defaults.
        if (typeof(properties) !== 'undefined') {
            for (key in properties) {

                if (this.hasOwnProperty(key)) {
                    this.setProperty(key, properties[key]);
                }

                if (this.hasOwnProperty(propertyMap[key])) {

                    if (key === "CLIENT_IP_ADDR") {
                        // The WEB_MESSASGING_USE_PROXY flag can be passed from the Java Pub Sub tools to
                        // indicate whether the proxy should be used when connecting to the router.
                        if (typeof(properties.WEB_MESSAGING_USE_PROXY) !== 'undefined' &&
                            properties.WEB_MESSAGING_USE_PROXY === true) {

                            properties[key] = solace.PubSubTools.utils.getHostUrl() + "/smf/router/" + properties[key];

                        } else {
                            if(properties[key].startsWith("https://")===true) {
                                properties[key] = properties[key];    
                            } else {
                                properties[key] = "http://" + properties[key];
                            }
                        }
                    }

                    this.setProperty(propertyMap[key], properties[key]);
                }
            }
        }
    };


    solace.PubSubTools.RuntimeProperties.prototype.getProperty = function(property) {

        if (typeof(this[property]) !== 'undefined') {

            return this[property].value

        } else if (typeof(propertyMap[property]) !== 'undefined' &&
            propertyMap[property] !== "" &&
            typeof(this[propertyMap[property]]) !== 'undefined') {

            return this[propertyMap[property]].value;

        } else {
            return undefined;
        }
    };


    solace.PubSubTools.RuntimeProperties.prototype.setProperty = function(property, value) {

        if (typeof(this[property]) !== 'undefined') {

            this[property].value = value;

        } else if (typeof(propertyMap[property]) !== 'undefined' &&
            propertyMap[property] !== "" &&
            typeof(this[propertyMap[property]]) !== 'undefined') {

            this[propertyMap[property]].value = value;

        } else {
            // ignore unrecognized properties.
        }
    };


    solace.PubSubTools.RuntimeProperties.prototype.getDefaultValues = function () {
        return defaultValues;
    };


    solace.PubSubTools.RuntimeProperties.prototype.getAllProperties = function () {
        var key;
        var values = {};

        for (key in this) {
            if (this.hasOwnProperty(key) &&
                typeof(this[key] !== 'function')) {
                values[key] = this[key].value;
            }
        }

        return values;
    };


    solace.PubSubTools.RuntimeProperties.prototype.getCacheProperties = function () {
        return (new solace.PubSubTools.CacheProperties(this));
    };


    solace.PubSubTools.RuntimeProperties.prototype.getClientProperties = function () {
        return (new solace.PubSubTools.ClientProperties(this));
    };


    solace.PubSubTools.RuntimeProperties.prototype.getMessageProperties = function () {
        return (new solace.PubSubTools.MessageProperties(this));
    };


    solace.PubSubTools.RuntimeProperties.prototype.getPublishProperties = function () {
        return (new solace.PubSubTools.PublishProperties(this));
    };


    solace.PubSubTools.RuntimeProperties.prototype.getStatsProperties = function () {
        return (new solace.PubSubTools.StatsProperties(this));
    };


}.apply(solace.PubSubTools));
