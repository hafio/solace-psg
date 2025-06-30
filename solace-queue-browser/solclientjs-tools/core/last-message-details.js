// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true, Int32Array:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {
    /**
     * @class
     * This class is 
     */
    solace.PubSubTools.LastMessageDetails = function LastMessageDetails () {
        this.m_replyToDestination         = null;
        this.m_replyToDestinationType     = null;
        this.m_destination                = null;
        this.m_destinationType            = null;
        this.m_httpContentType            = null;
        this.m_httpContentEncoding        = null;
        this.m_correlationId              = null;
        this.m_customPropertyList         = null;
        this.m_expiration                 = null;
        this.m_priority                   = null;
        this.m_appMessageId               = null;
        this.m_appMessageType             = null;
        this.m_senderTimestamp            = null;
        this.m_cos                        = null;
        this.m_deliveryMode               = null;
        this.m_deliveryCount              = null;
        this.m_redelivered                = null;
        this.m_replicationGroupMsgId      = null;
        this.m_type                       = null;
        this.m_objectType                 = null;
        this.m_messageId                  = null;
        this.m_payload                    = null;
        this.m_isAckImmediately           = null;
        this.m_isDmqEligible              = null;
        this.m_creationContextTraceId     = null;
        this.m_creationContextSpanId      = null;
        this.m_creationContextSampled     = null;
        this.m_creationContextTraceState  = null;
        this.m_transportContextTraceId    = null;
        this.m_transportContextSpanId     = null;
        this.m_transportContextSampled    = null;
        this.m_transportContextTraceState = null;
        this.m_baggage                    = null;
        this.m_binaryPayloadSize          = null;
    };

    solace.PubSubTools.LastMessageDetails.prototype.clear = function() {
        this.m_replyToDestination         = null;
        this.m_replyToDestinationType     = null;
        this.m_destination                = null;
        this.m_destinationType            = null;
        this.m_httpContentType            = null;
        this.m_httpContentEncoding        = null;
        this.m_correlationId              = null;
        this.m_customPropertyList         = null;
        this.m_expiration                 = null;
        this.m_priority                   = null;
        this.m_appMessageId               = null;
        this.m_appMessageType             = null;
        this.m_senderTimestamp            = null;
        this.m_cos                        = null;
        this.m_deliveryMode               = null;
        this.m_deliveryCount              = null;
        this.m_redelivered                = null;
        this.m_replicationGroupMsgId      = null;
        this.m_type                       = null;
        this.m_objectType                 = null;
        this.m_messageId                  = null;
        this.m_payload                    = null;
        this.m_isAckImmediately           = null;
        this.m_isDmqEligible              = null;
        this.m_creationContextTraceId     = null;
        this.m_creationContextSpanId      = null;
        this.m_creationContextSampled     = null;
        this.m_creationContextTraceState  = null;
        this.m_transportContextTraceId    = null;
        this.m_transportContextSpanId     = null;
        this.m_transportContextSampled    = null;
        this.m_transportContextTraceState = null;
        this.m_baggage                    = null;
        this.m_binaryPayloadSize          = null;
    };

    solace.PubSubTools.LastMessageDetails.prototype.clone = function() {
        var ret = new solace.PubSubTools.LastMessageDetails();

        ret.m_replyToDestination         = this.m_replyToDestination;
        ret.m_replyToDestinationType     = this.m_replyToDestinationType;
        ret.m_destination                = this.m_destination;
        ret.m_destinationType            = this.m_destinationType;
        ret.m_httpContentType            = this.m_httpContentType;
        ret.m_httpContentEncoding        = this.m_httpContentEncoding;
        ret.m_correlationId              = this.m_correlationId;
        ret.m_customPropertyList         = this.m_customPropertyList;
        ret.m_expiration                 = this.m_expiration;
        ret.m_priority                   = this.m_priority;
        ret.m_appMessageId               = this.m_appMessageId;
        ret.m_appMessageType             = this.m_appMessageType;
        ret.m_senderTimestamp            = this.m_senderTimestamp;
        ret.m_cos                        = this.m_cos;
        ret.m_deliveryMode               = this.m_deliveryMode;
        ret.m_deliveryCount              = this.m_deliveryCount;
        ret.m_redelivered                = this.m_redelivered;
        ret.m_replicationGroupMsgId      = this.m_replicationGroupMsgId;
        ret.m_type                       = this.m_type;
        ret.m_objectType                 = this.m_objectType;
        ret.m_messageId                  = this.m_messageId;
        ret.m_payload                    = this.m_payload;
        ret.m_isAckImmediately           = this.m_isAckImmediately;
        ret.m_isDmqEligible              = this.m_isDmqEligible;
        ret.m_creationContextTraceId     = this.m_creationContextTraceId;
        ret.m_creationContextSpanId      = this.m_creationContextSpanId;
        ret.m_creationContextSampled     = this.m_creationContextSampled;
        ret.m_creationContextTraceState  = this.m_creationContextTraceState;
        ret.m_transportContextTraceId    = this.m_transportContextTraceId;
        ret.m_transportContextSpanId     = this.m_transportContextSpanId;
        ret.m_transportContextSampled    = this.m_transportContextSampled;
        ret.m_transportContextTraceState = this.m_transportContextTraceState;
        ret.m_baggage                    = this.m_baggage;
        ret.m_binaryPayloadSize          = this.m_binaryPayloadSize;

        return ret;
    };

    solace.PubSubTools.LastMessageDetails.prototype.setReplyToDestination = function(replyToDestination) {
        this.m_replyToDestination = replyToDestination;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setDestination = function(destination) {
        this.m_destination = destination;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setReplyToDestinationType = function(replyToDestinationType) {
        this.m_replyToDestinationType = replyToDestinationType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setDestinationType = function(destinationType) {
        this.m_destinationType = destinationType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setHttpContentType = function(httpContentType) {
        this.m_httpContentType = httpContentType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setHttpContentEncoding = function(httpContentEncoding) {
        this.m_httpContentEncoding = httpContentEncoding;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setCorrelationId = function(correlationId) {
        this.m_correlationId = correlationId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setCustomPropertyList = function(customPropertyList) {
        this.m_customPropertyList = customPropertyList;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setExpiration = function(expiration) {
        this.m_expiration = expiration;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setPriority = function(priority) {
        this.m_priority = priority;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setApplicationMessageId = function(appMessageId) {
        this.m_appMessageId = appMessageId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setApplicationMessageType = function(appMessageType) {
        this.m_appMessageType = appMessageType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setSenderTimestamp = function(senderTimestamp) {
        this.m_senderTimestamp = senderTimestamp;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setCos = function(cos) {
        this.m_cos = cos;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setDeliveryMode = function(deliveryMode) {
        this.m_deliveryMode = deliveryMode;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setDeliveryCount = function(deliveryCount) {
        this.m_deliveryCount = deliveryCount;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setReplicationGroupMsgId = function(replicationGroupMsgId) { 
        this.m_replicationGroupMsgId = replicationGroupMsgId; 
    };
    solace.PubSubTools.LastMessageDetails.prototype.setRedelivered = function(redelivered) {
        this.m_redelivered = redelivered;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setType = function(type) {
        this.m_type = type;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setObjectType = function(objectType) {
        this.m_objectType = objectType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setMessageId = function(messageId) {
        this.m_messageId = messageId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setPayload = function(payload) {
        this.m_payload = payload;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setAckImmediately = function(ackImmediately) {
        this.m_isAckImmediately = ackImmediately;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setDmqEligible = function(dmqEligible) {
        this.m_isDmqEligible = dmqEligible;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setCreationContextTraceId = function(tid) {
        this.m_creationContextTraceId = tid;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setCreationContextSpanId = function(sid) {
        this.m_creationContextSpanId = sid;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setCreationContextSampled = function(sampled) {
        this.m_creationContextSampled = sampled;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setCreationContextTraceState = function(state) {
        this.m_creationContextTraceState = state;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setTransportContextTraceId = function(tid) {
        this.m_transportContextTraceId = tid;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setTransportContextSpanId = function(sid) {
        this.m_transportContextSpanId = sid;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setTransportContextSampled = function(sampled) {
        this.m_transportContextSampled = sampled;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setTransportContextTraceState = function(state) {
        this.m_transportContextTraceState = state;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setBaggage = function(baggage) {
        this.m_baggage = baggage;
    };
    solace.PubSubTools.LastMessageDetails.prototype.setBinaryPayloadSize = function(size) {
        this.m_binaryPayloadSize = size;
    };

    solace.PubSubTools.LastMessageDetails.prototype.getReplyToDestination = function() {
        return this.m_replyToDestination;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDestination = function() {
        return this.m_destination;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getReplyToDestinationType = function() {
        return this.m_replyToDestinationType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDestinationType = function() {
        return this.m_destinationType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getHttpContentType = function() {
        return this.m_httpContentType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getHttpContentEncoding = function() {
        return this.m_httpContentEncoding;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCorrelationId = function() {
        return this.m_correlationId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCustomPropertyList = function() {
        return this.m_customPropertyList;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getExpiration = function() {
        return this.m_expiration;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getPriority = function() {
        return this.m_priority;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getApplicationMessageId = function() {
        return this.m_appMessageId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getApplicationMessageType = function() {
        return this.m_appMessageType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getSenderTimestamp = function() {
        return this.m_senderTimestamp;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCos = function() {
        return this.m_cos;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDeliveryMode = function() {
        return this.m_deliveryMode;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDeliveryCount = function() {
        return this.m_deliveryCount;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getReplicationGroupMsgId = function() { 
        return this.m_replicationGroupMsgId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getRedelivered = function() {
        return this.m_redelivered;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getType = function() {
        return this.m_type;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getObjectType = function() {
        return this.m_objectType;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getMessageId = function() {
        return this.m_messageId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getPayload = function () {
        return this.m_payload;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getQos = function() {
        return this.m_qos;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getRetained = function() {
        return this.m_isRetained;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDuplicate = function() {
        return this.m_isDuplicate;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getPayloadFormat = function() {
        return this.m_payloadFormat;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getHeaderList = function() {
        return this.m_headerList;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getParmList = function() {
        return this.m_parmList;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDecodedHeader = function() {
        return this.m_decodedHeader;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDecodedPayload = function() {
        return this.m_decodedPayload;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getAckImmediately = function() {
        return this.m_isAckImmediately;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getDmqEligible = function() {
        return this.m_isDmqEligible;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCipherSuite = function() {
        return this.m_cipherSuite;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCreationContextTraceId = function() {
        return this.m_creationContextTraceId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCreationContextSpanId = function() {
        return this.m_creationContextSpanId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCreationContextSampled = function() {
        return this.m_creationContextSampled;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getCreationContextTraceState = function() {
        return this.m_creationContextTraceState;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getTransportContextTraceId = function() {
        return this.m_transportContextTraceId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getTransportContextSpanId = function() {
        return this.m_transportContextSpanId;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getTransportContextSampled = function() {
        return this.m_transportContextSampled;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getTransportContextTraceState = function() {
        return this.m_transportContextTraceState;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getBaggage = function() {
        return this.m_baggage;
    };
    solace.PubSubTools.LastMessageDetails.prototype.getBinaryPayloadSize = function() {
        return this.m_binaryPayloadSize;
    };
}.apply(solace.PubSubTools));
