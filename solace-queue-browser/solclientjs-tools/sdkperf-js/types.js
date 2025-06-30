// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {
    solace.PubSubTools.perfStatType = (function () {

        return {
            latencyUsecMin:             "LATENCY_USEC_MIN",
            latencyUsecAvg:             "LATENCY_USEC_AVG",
            latencyUsecMax:             "LATENCY_USEC_MAX",
            numMsgsPri0:                "NUM_MSGS_PRI_0",
            numMsgsPri1:                "NUM_MSGS_PRI_1",
            numMsgsPri2:                "NUM_MSGS_PRI_2",
            numMsgsPri3:                "NUM_MSGS_PRI_3",
            numMsgsPri4:                "NUM_MSGS_PRI_4",
            numMsgsPri5:                "NUM_MSGS_PRI_5",
            numMsgsPri6:                "NUM_MSGS_PRI_6",
            numMsgsPri7:                "NUM_MSGS_PRI_7",
            numMsgsPri8:                "NUM_MSGS_PRI_8",
            numMsgsPri9:                "NUM_MSGS_PRI_9",
            numMsgsPriMore:             "NUM_MSGS_PRI_MORE",

            numMsgsPriSent0:            "NUM_MSGS_PRI_SENT_0",
            numMsgsPriSent1:            "NUM_MSGS_PRI_SENT_1",
            numMsgsPriSent2:            "NUM_MSGS_PRI_SENT_2",
            numMsgsPriSent3:            "NUM_MSGS_PRI_SENT_3",
            numMsgsPriSent4:            "NUM_MSGS_PRI_SENT_4",
            numMsgsPriSent5:            "NUM_MSGS_PRI_SENT_5",
            numMsgsPriSent6:            "NUM_MSGS_PRI_SENT_6",
            numMsgsPriSent7:            "NUM_MSGS_PRI_SENT_7",
            numMsgsPriSent8:            "NUM_MSGS_PRI_SENT_8",
            numMsgsPriSent9:            "NUM_MSGS_PRI_SENT_9",
            numMsgsPriSentMore:         "NUM_MSGS_PRI_SENT_MORE",

            numMsgsRecv:                "NUM_MSGS_RECV",
            numLatencyMsgs:             "NUM_LATENCY_MSGS",
            numTputMsgs:                "NUM_TPUT_MSGS",
            numMsgsCrcOk:               "NUM_MSGS_CRC_OK",
            numMsgsCrcFail:             "NUM_MSGS_CRC_FAIL",
            numMsgsCrcXmlPayloadOk:     "NUM_MSGS_CRC_XML_PAY_OK",
            numMsgsCrcXmlPayloadFail:   "NUM_MSGS_CRC_XML_PAY_FAIL",
            numMsgsCrcBinAttachOk:      "NUM_MSGS_CRC_BIN_ATT_OK",
            numMsgsCrcBinAttachFail:    "NUM_MSGS_CRC_BIN_ATT_FAIL",
            numMsgsCrcUdOk:             "NUM_MSGS_USERDATA_OK",
            numMsgsCrcUdFail:           "NUM_MSGS_USERDATA_FAIL",
            numMsgsCrcSdmOk:            "NUM_MSGS_CRC_SDM_OK",
            numMsgsCrcSdmFail:          "NUM_MSGS_CRC_SDM_FAIL",
            numMsgsXmlPayload:          "NUM_MSGS_XML_PAY",
            numMsgsBinAttach:           "NUM_MSGS_BIN_ATTACH",
            numMsgsUd:                  "NUM_MSGS_USERDATA",
            numMsgsCid:                 "NUM_MSGS_CID",
            numMsgsTopic:               "NUM_MSGS_TOPIC",
            numMsgsOrderChecked:        "NUM_MSGS_ORDER_CHECKED",
            numRepGrpMsgIdDuplicates:   "NUM_REPLICATION_GROUP_MESSAGE_ID_DUPLICATES",
            numRepGrpMsgIdSpoolChanges: "NUM_REPLICATION_GROUP_MESSAGE_ID_SPOOL_ID_CHANGES",
            numMsgsRedelivered:         "NUM_MSGS_REDELIVERED",
            numCacheReqSent:            "NUM_CACHE_REQ_SENT",
            numCacheRespRecv:           "NUM_CACHE_RESP_RECV",
            numLiveMsgsRecv:            "NUM_LIVE_MSGS_RECV",
            numCacheMsgsRecv:           "NUM_CACHE_MSGS_RECV",
            numCacheSuspectRecv:        "NUM_CACHE_SUSPECT_RECV",
            numCacheReqOk:              "NUM_CACHE_REQ_OK",
            numCacheReqIncompNoData:    "NUM_CACHE_REQ_INCOMP_NODATA",
            numCacheReqIncompSuspect:   "NUM_CACHE_REQ_INCOMP_SUSPECT",
            numCacheReqIncompTimeout:   "NUM_CACHE_REQ_INCOMP_TIMEOUT",
            numCacheReqError:           "NUM_CACHE_REQ_ERROR",
            numMsgsDiSet:               "NUM_MSGS_DI_SET",
            psmNumCyclesBehind:         "PSM_MAX_CYCLES_BEHIND",
            psmNumTimesBehind:          "PSM_NUM_TIMES_BEHIND",
            numAckEvents:               "NUM_ACK_EVENTS",
            numNackEvents:              "NUM_NACK_EVENTS",
            numPubMsgsAcked:            "NUM_PUB_MSGS_ACKED",

            numMsgsReceivedObjTypeOk:   "NUM_MSGS_RECEIVED_OBJECT_TYPE_OK",
            numMsgsReceivedObjTypeFail: "NUM_MSGS_RECEIVED_OBJECT_TYPE_FAIL"
        };
    }());

}.apply(solace.PubSubTools));
