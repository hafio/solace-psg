// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    // String constants

    solace.PubSubTools.Title = "sdkperf-js";

    solace.PubSubTools.Version = {
        version:    "8.3.18.6",
        date:       "20250428-1436"
    };

    solace.PubSubTools.ApiName = "solclientjs";

    // The sdkperf webpage is made up using building blocks.  Each of
    // these blocks contains a list of properties.  The properties
    // are defined in runtime-properties.js.
    solace.PubSubTools.blocks = {
        clientControl: {
            label:          "Client Control",
            id:             "client-control",
            basicProps: [
                "url",
                "userName",
                "vpnName"
            ],
            advProps:   [
                "reconnectRetryCount",
                "reconnectRetryIntervalInMs",
                "reapplySubscriptions",
                "clientNamePrefix",
                "changeClientName",
                "password",
                "clientNum",
                "applicationDescription",
                "keepAliveIntervalInMsecs",
                "keepAliveIntervalsLimit",
                "connectTimeoutInMsecs",
                "readTimeoutInMsecs",
                "clientMode",
                "transportProtocol",
                "transportDowngradeTimeoutInMsecs"
            ]
        },
        clientAckOptionsControl : {
            label:          "Client Ack Options Control",
            id:             "client-ack-options-control",
            basicProps: [

            ],
            advProps: [
                "wantNoLocal"
            ]
        },
        assuredDeliveryControl : {
            label:          "Assured Delivery Control",
            id:             "assured-delivery-control",
            basicProps: [

            ],
            advProps: [
                "activeFlowInd",
                "subscribeAckThresh",
                "subscribeAckTime",
                "subscribeWindow",
                "wantNoLocal",
                "wantReplay",
                "wantReplayFromDate",
                "wantReplayFromMsgId"
            ]
        },
        messageControl: {
            label:          "Message Control",
            id:             "message-control",
            basicProps: [
                "xmlSizeList",
                "attachmentSizeList"
            ],
            advProps:   [
                "attachmentSizeSweep"
            ]
        },
        subControl: {
            label:          "Subscribe Control",
            id:             "subscribe-control",
            basicProps: [
                "subscribeTopicList",
                "subscribeQueueList"    
            ],
            advProps:   [
                "subscriberRateInterval",
                "wantMessageDump",
                "temporaryTopicEndpoints",
                "temporaryQueueEndpoints",
                "permission",
                "accessType",
                "quota",
                "maxMessageSize",
                "maxMessageRedelivery",
                "respectTTL",
                "discardNotifySender",
                "wantProvision"
            ]
        },
        pubControl: {
            label:          "Publish Control",
            id:             "publish-control",
            basicProps: [
                "publishTopicList",
                "publishQueueList", 
                "messageNum",
                "messageRate"
            ],
            advProps:   [
                "maxWebPayload",
                "sendBufferMaxSize",
                "deliverToOne",
                "elidingEligible",
                "publishReplyTopic",
                "publishReplyPostfix",
                "classOfService",
                "publishEndDelay",
                "messageDeliveryModeType"   
            ]
        },
        integrityControl: {
            label:          "Integrity Control",
            id:             "integrity-control",
            basicProps: [
                "wantOrderCheck",
                "wantCrcCheck"
            ],
            advProps:   [
                "publishOrderOffset",
                "publishStreamOffset"
            ]
        },
        cacheControl: {
            label:          "Cache Control",
            id:             "cache-control",
            basicProps: [
                "cacheName",
                "publishTopicList",
                "cacheRequestNumber",
                "cacheRequestRate",
                "subscribeTopicList",
                "cacheWantRequestOnSubscribe"

            ],
            advProps:   [
                "cacheLiveDataAction",
                "cacheMaxAgeInSecs",
                "cacheMaxMessages",
                "cacheTimeoutInMsecs"
            ]
        },
        authentication: {
            label:          "Authentication",
            id:             "auth",
            basicProps: [
                "authenticationScheme"
            ],
            advProps:   [
                "oauthAccessToken",
                "oauthIssuerId",
                "oauthIdToken"
                // "sslProtocol",
                // "sslExcludedProtocols",
                // "sslValidateCertificate",
                // "sslCipherSuites",
                // "sslTrustStores",
                // "sslTrustedCommonNameList",
                // "sslCertificate",
                // "sslPrivateKey"
            ]
        },
        generalSettings: {
            label:          "General Settings",
            id:             "general-settings",
            basicProps: [
                "logLevel",
                "remoteLogServer",
                "autoStart",
                "extraPropsList"   
            ],
            advProps:   [
            ]
        }
    };


    // Drop Down Select Menus

    solace.PubSubTools.ClassOfServiceSelect = {
        UNSPECIFIED:    {   label: "unspecified",
                            value: -1
                        },
        COS1:           {   label: "COS1",
                            value: solace.MessageUserCosType.COS1
                        },
        COS2:           {   label: "COS2",
                            value: solace.MessageUserCosType.COS2
                        },
        COS3:           {   label: "COS3",
                            value: solace.MessageUserCosType.COS3
                        }
    };

    solace.PubSubTools.MessageDeliveryModeTypeSelect = {
        DIRECT:         {   label: "Direct",        value: "direct" },
        PERSISTENT:     {   label: "Persistent",    value: "persistent"},
        NONPERSISTENT:  {   label: "Non Persistent", value: "nonpersistent"}
    };

    solace.PubSubTools.AuthenticationSchemeSelect = {
        UNSPECIFIED:    {   label: "Unspecified",   value: "UNSPECIFIED" },
        BASIC:          {   label: "Basic",         value: "basic"},
        CERTIFICATE:    {   label: "Certificate",   value: "certificate"},
        OAUTH2:         {   label: "OAuth2",        value: "oauth2"}
    };

    solace.PubSubTools.SslProtocolSelect = {
        UNSPECIFIED:    {   label: "unspecified",   value: "UNSPECIFIED" },
        TLSV1:          {   label: "TLSv1",         value: "tlsv1"},
        TLSV1_1:        {   label: "TLSv1_1",       value: "tlsv1.1"},
        TLSV1_2:        {   label: "TLSv1_2",       value: "tlsv1.2"},
        TLSV1_3:        {   label: "TLSv1_3",       value: "tlsv1.3"}
    };

    solace.PubSubTools.AdAckEventModeSelect = {
        "per-message":    {   label:  "PER_MESSAGE",  value: solace.MessagePublisherAcknowledgeMode.PER_MESSAGE},
        "windowed":       {   label:  "WINDOWED",     value: solace.MessagePublisherAcknowledgeMode.WINDOWED}
    };

    solace.PubSubTools.ClientModeSelect = {
        SINK:   { label: "sink",    value: "sink"},
        REPLY:  { label: "reply",   value: "reply"}
    };

    solace.PubSubTools.LogLevelSelect = {
        TRACE:  { label: "TRACE",   value: solace.LogLevel.TRACE },
        DEBUG:  { label: "DEBUG",   value: solace.LogLevel.DEBUG },
        INFO:   { label: "INFO",    value: solace.LogLevel.INFO },
        WARN:   { label: "WARN",    value: solace.LogLevel.WARN },
        ERROR:  { label: "ERROR",   value: solace.LogLevel.ERROR },
        FATAL:  { label: "FATAL",   value: solace.LogLevel.FATAL }
    };

    solace.PubSubTools.TransportProtocolSelect = {
        UNSPECIFIED:    { label: "unspecified", value: "UNSPECIFIED" },
        BASE64:         { label: "base64",      value: solace.TransportProtocol.HTTP_BASE64 },
        BINARY:         { label: "binary",      value: solace.TransportProtocol.HTTP_BINARY },
        STREAMING_BINARY: { label: "streaming binary", value: solace.TransportProtocol.HTTP_BINARY_STREAMING },
        WEB_SOCKET:     { label: "web socket",  value: solace.TransportProtocol.WS_BINARY }
    };

    solace.PubSubTools.EndpointTypes = {
        DQE:   { label: "Durable Queue",            value:solace.QueueType.QUEUE,           durable:true },
        TQE:   { label: "Temporary Queue",          value:solace.QueueType.QUEUE,           durable:false },
        DTE:   { label: "Durable Topic Endpoint",   value:solace.QueueType.TOPIC_ENDPOINT,  durable:true },
        TTE:   { label: "Temporary Topic Endpoint", value:solace.QueueType.TOPIC_ENDPOINT,  durable:false }
    };

    solace.PubSubTools.ActiveFlowIndicationTypes = {
        ACTIVE:     { label: "Active",  value:true },
        INACTIVE:   { label: "Inactive",  value:false }
    };

    solace.PubSubTools.CacheLiveDataActionSelect = {
        FULFILL:        { label: "FULFILL",     value: solace.CacheLiveDataAction.FULFILL },
        QUEUE:          { label: "QUEUE",       value: solace.CacheLiveDataAction.QUEUE },
        FLOW_THRU:      { label: "FLOW_THRU",   value: solace.CacheLiveDataAction.FLOW_THRU }
    };

    solace.PubSubTools.SslConnectionDowngradeToSelect = {
        NONE:           { label: "none",        value: "NONE" },
        PLAIN_TEXT:     { label: "plaintext",   value: "PLAIN_TEXT" }
    };

}.apply(solace.PubSubTools));