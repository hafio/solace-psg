// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true, Int32Array:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    solace.PubSubTools.crc32Table = [
        0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3, 
        0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 
        0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 
        0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 
        0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 
        0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 
        0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F, 
        0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 
        0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433, 
        0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 
        0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 
        0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 
        0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 
        0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 
        0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 
        0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 
        0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 
        0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 
        0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 
        0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 
        0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 
        0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 
        0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 
        0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 
        0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 
        0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 
        0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 
        0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 
        0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 
        0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 
        0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 
        0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
    ];
    if (typeof Int32Array !== 'undefined') {
        solace.PubSubTools.crc32Table = new Int32Array(solace.PubSubTools.crc32Table);
    }

    solace.PubSubTools.crc32 = function (str) {
        var crc = 0xFFFFFFFF;
        var table = solace.PubSubTools.crc32Table;
        for (var i = 0, n = str.length; i < n; ++i) {
            var byte = str.charCodeAt(i);
            crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
        }
        return crc ^ -1;
    };

    solace.PubSubTools.TOOL_DATA_BITMAP = (function () {
        return {
            CRC_XML_PAYLOAD:    0x0001,
            STREAM_ID:          0x0002,
            RFFU2:              0x0004,
            CRC_BIN_ATTACH:     0x0008,
            MESSAGE_ID:         0x0010,
            LATENCY:            0x0020
        };
    }());

    /**
     * @class
     * This class is used to encode and decode tool specific data.
     * Tool data is published and received in the binary attachment
     * portion of a message in a format that is platform independent
     * and common across all tools.
     *
     * Information carried in the tool data currently is:
     *      - Latency time stamp
     *      - Message ID (order checking)
     *      - CRC for binary attachments
     *      - CRC for xml payloads
     */
    solace.PubSubTools.ToolData = function ToolData () {
        this.TOOL_DATA_HEADER    = [0x50, 0x1a, 0xce, 0x01];
        this.reset();
    };

    solace.PubSubTools.ToolData.PROP_BIN_PAYLOAD_HASH = "b";
    solace.PubSubTools.ToolData.PROP_XML_PAYLOAD_HASH = "x";
    solace.PubSubTools.ToolData.PROP_STREAM_ID = "s";
    solace.PubSubTools.ToolData.PROP_MESSAGE_ID = "m";
    solace.PubSubTools.ToolData.PROP_LATENCY = "l";

    solace.PubSubTools.ToolData.prototype.reset = function () {

        this.m_hasLatency       = false;
        this.m_latency          = 0;
        this.m_messageId        = -1;
        this.m_streamId         = -1;
        this.m_crcBinAttach     = null;
        this.m_crcXmlPayload    = null;

        this.m_decodedSize      = 0;
    };


    solace.PubSubTools.ToolData.prototype.encode = function (bytes) {

        var toolDataEnd     = 0;
        var presenceData    = 0;

        if (this.getEncodedSize() > bytes.length) {
            throw new solace.PubSubTools.PubSubError("Encode destination too small");
        }

        bytes.splice.apply(bytes, [toolDataEnd, this.TOOL_DATA_HEADER.length].concat(this.TOOL_DATA_HEADER));
        toolDataEnd += this.TOOL_DATA_HEADER.length;

        // Leave space for the presence data.  It will be inserted at the end.
        toolDataEnd += 4;

        if (this.hasCrcXmlPayload()) {
            bytes.splice.apply(bytes, [toolDataEnd, 4].concat(solace.PubSubTools.ToolData.int32ToByteArray(this.m_crcXmlPayload)));
            toolDataEnd += 4;
            presenceData |= solace.PubSubTools.TOOL_DATA_BITMAP.CRC_XML_PAYLOAD;
        }

        if (this.hasStreamId()) {
            bytes.splice.apply(bytes, [toolDataEnd, 4].concat(solace.PubSubTools.ToolData.int32ToByteArray(this.m_streamId)));
            toolDataEnd += 4;
            presenceData |= solace.PubSubTools.TOOL_DATA_BITMAP.STREAM_ID;
        }

        if (this.hasCrcBinAttach()) {
            bytes.splice.apply(bytes, [toolDataEnd, 4].concat( solace.PubSubTools.ToolData.int32ToByteArray(this.m_crcBinAttach)));
            toolDataEnd += 4;
            presenceData |= solace.PubSubTools.TOOL_DATA_BITMAP.CRC_BIN_ATTACH;
        }

        if (this.hasMessageId()) {
            bytes.splice.apply(bytes, [toolDataEnd, 8].concat(solace.PubSubTools.ToolData.int64ToByteArray(this.m_messageId)));
            toolDataEnd += 8;
            presenceData |= solace.PubSubTools.TOOL_DATA_BITMAP.MESSAGE_ID;
        }

        if (this.hasLatency()) {
            bytes.splice.apply(bytes, [toolDataEnd, 8].concat(solace.PubSubTools.ToolData.int64ToByteArray(this.m_latency)));
            toolDataEnd += 8;
            presenceData |= solace.PubSubTools.TOOL_DATA_BITMAP.LATENCY;
        }

        bytes.splice.apply(bytes, [this.TOOL_DATA_HEADER.length, 4].concat(solace.PubSubTools.ToolData.int32ToByteArray(presenceData)));
    };


    solace.PubSubTools.ToolData.prototype.decode = function (bytes) {

        var i;
        var presenceData;

        this.reset();

        if (bytes.length > (this.TOOL_DATA_HEADER.length + 4)) {

            for (i = 0; i < this.TOOL_DATA_HEADER.length; ++i) {
                if (this.TOOL_DATA_HEADER[i] !== bytes[i]) {
                    // Our data doesn't start with the TOOL_DATA_HEADER, so return.
                    return;
                }
            }

            this.m_decodedSize = this.TOOL_DATA_HEADER.length;

            presenceData = solace.PubSubTools.ToolData.byteArrayToInt32(bytes.slice(this.m_decodedSize, this.m_decodedSize + 4));
            this.m_decodedSize += 4;

            // Parse these in increasing order to get it right.
            if ((presenceData & solace.PubSubTools.TOOL_DATA_BITMAP.CRC_XML_PAYLOAD) > 0) {

                // Check for invalid tool data.
                if ((this.m_decodedSize + 4) > bytes.length) {
                    this.reset();
                    throw new solace.PubSubTools.PubSubError("Invalid tool data.  Out of bounds parsing msg xml payload integrity");
                }
                this.m_crcXmlPayload = solace.PubSubTools.ToolData.byteArrayToInt32(bytes.slice(this.m_decodedSize, this.m_decodedSize + 4));
                this.m_decodedSize += 4;
            }

            if ((presenceData & solace.PubSubTools.TOOL_DATA_BITMAP.STREAM_ID) > 0) {

                // Check for invalid tool data.
                if ((this.m_decodedSize + 4) > bytes.length) {
                    this.reset();
                    throw new solace.PubSubTools.PubSubError("Invalid tool data.  Out of bounds parsing msg stream id");
                }
                this.m_streamId = solace.PubSubTools.ToolData.byteArrayToInt32(bytes.slice(this.m_decodedSize, this.m_decodedSize + 4));
                this.m_decodedSize += 4;
            }

            if ((presenceData & solace.PubSubTools.TOOL_DATA_BITMAP.CRC_BIN_ATTACH) > 0) {

                // Check for invalid tool data.
                if ((this.m_decodedSize + 4) > bytes.length) {
                    this.reset();
                    throw new solace.PubSubTools.PubSubError("Invalid tool data.  Out of bounds parsing msg binary attachment integrity");
                }
                this.m_crcBinAttach = solace.PubSubTools.ToolData.byteArrayToInt32(bytes.slice(this.m_decodedSize, this.m_decodedSize + 4));
                this.m_decodedSize += 4;
            }

            if ((presenceData & solace.PubSubTools.TOOL_DATA_BITMAP.MESSAGE_ID) > 0) {

                // Check for invalid tool data.
                if ((this.m_decodedSize + 8) > bytes.length) {
                    this.reset();
                    throw new solace.PubSubTools.PubSubError("Invalid tool data.  Out of bounds parsing msg id");
                }
                this.m_messageId = solace.PubSubTools.ToolData.byteArrayToInt64(bytes.slice(this.m_decodedSize, this.m_decodedSize + 8));
                this.m_decodedSize += 8;
            }

            if ((presenceData & solace.PubSubTools.TOOL_DATA_BITMAP.LATENCY) > 0) {

                // Check for invalid tool data.
                if ((this.m_decodedSize + 8) > bytes.length) {
                    this.reset();
                    throw new solace.PubSubTools.PubSubError("Invalid tool data.  Out of bounds parsing latency");
                }
                this.m_latency = solace.PubSubTools.ToolData.byteArrayToInt64(bytes.slice(this.m_decodedSize, this.m_decodedSize + 8));
                this.m_decodedSize += 8;
            }
        }
    };


    solace.PubSubTools.ToolData.prototype.hasData = function () {
        return (this.hasLatency() ||
                this.hasCrcBinAttach() ||
                this.hasCrcXmlPayload() ||
                this.hasMessageId() ||
                this.hasStreamId());
    };


    solace.PubSubTools.ToolData.prototype.getLatency = function () {
        return this.m_latency;
    };

    solace.PubSubTools.ToolData.prototype.setLatency = function (latency) {
        this.m_latency = latency;
        this.m_hasLatency = true;
    };

    solace.PubSubTools.ToolData.prototype.hasLatency = function () {
        return this.m_hasLatency;
    };


    solace.PubSubTools.ToolData.prototype.getMessageId = function () {
        return this.m_messageId;
    };

    solace.PubSubTools.ToolData.prototype.setMessageId = function (messageId) {
        this.m_messageId = messageId;
    };

    solace.PubSubTools.ToolData.prototype.hasMessageId = function () {
        return (this.m_messageId !== -1);
    };


    solace.PubSubTools.ToolData.prototype.getStreamId = function () {
        return this.m_steamId;
    };

    solace.PubSubTools.ToolData.prototype.setStreamId = function (streamId) {
        this.m_streamId = streamId;
    };

    solace.PubSubTools.ToolData.prototype.hasStreamId = function () {
        return (this.m_streamId !== -1);
    };


    solace.PubSubTools.ToolData.prototype.getCrcBinAttach = function () {
        return this.m_crcBinAttach;
    };

    solace.PubSubTools.ToolData.prototype.setCrcBinAttach = function (crcBinAttach) {
        this.m_crcBinAttach = crcBinAttach;
    };

    solace.PubSubTools.ToolData.prototype.hasCrcBinAttach = function () {
        return (this.m_crcBinAttach !== null);
    };

    solace.PubSubTools.ToolData.prototype.clearCrcBinAttach = function () {
        this.m_crcBinAttach = null;
    };


    solace.PubSubTools.ToolData.prototype.getCrcXmlPayload = function () {
        return this.m_crcXmlPayload;
    };

    solace.PubSubTools.ToolData.prototype.setCrcXmlPayload = function (crcXmlPayload) {
        this.m_crcXmlPayload = crcXmlPayload;
    };

    solace.PubSubTools.ToolData.prototype.hasCrcXmlPayload = function () {
        return (this.m_crcXmlPayload !== null);
    };


    solace.PubSubTools.ToolData.prototype.getDecodedSize = function () {
        if (this.m_decodedSize === null || this.m_decodedSize < 0) {
            return 0;
        }

        return this.m_decodedSize;
    };

    solace.PubSubTools.ToolData.prototype.getEncodedSize = function () {
        var toolDataSize = 0;

        // Tool data header and presence bitmap are always first.
        toolDataSize += this.TOOL_DATA_HEADER.length + 4;

        if (this.hasLatency())          { toolDataSize += 8; }
        if (this.hasCrcBinAttach())     { toolDataSize += 4; }
        if (this.hasCrcXmlPayload())    { toolDataSize += 4; }
        if (this.hasMessageId())        { toolDataSize += 8; }
        if (this.hasStreamId())         { toolDataSize += 4; }

        return toolDataSize;
    };


    solace.PubSubTools.ToolData.int32ToByteArray = function (int32) {
        return ([((int32 >> 24) & 0xff),
                ((int32 >> 16) & 0xff),
                ((int32 >> 8) & 0xff),
                (int32 & 0xff)]);
    };

    solace.PubSubTools.ToolData.byteArrayToInt32 = function (byteArray) {
        return ((byteArray[0] << 24) +
                (byteArray[1] << 16) +
                (byteArray[2] << 8) +
                byteArray[3]);
    };


    solace.PubSubTools.ToolData.int64ToByteArray = function (int64) {

        // Javascript does not support 64-integers.  All numbers are 64-bit
        // floating point numbers.  As such, we do a safe conversion and
        // only consider the lower 48-bits.

        return ([0,
                 0,
                ((int64 / 1099511627776) & 0xff),
                ((int64 / 4294967296) & 0xff),
                ((int64 / 16777216) & 0xff),
                ((int64 / 65536) & 0xff),
                ((int64 / 256) & 0xff),
                (int64 & 0xff)]);
    };

    solace.PubSubTools.ToolData.byteArrayToInt64 = function (byteArray) {

        // Javascript does not support 64-integers.  All numbers are 64-bit
        // floating point numbers.  As such, we do a safe conversion and
        // only consider the lower 48-bits.

        return (byteArray[2] * 1099511627776 +
                byteArray[3] * 4294967296 +
                byteArray[4] * 16777216 +
                byteArray[5] * 65536 +
                byteArray[6] * 256 +
                byteArray[7]);
    };


    solace.PubSubTools.ToolData.prototype.toString = function () {
        var buf = new solace.StringBuffer();

        if (this.hasCrcXmlPayload()) {
            buf.append(" XML Payload Integrity  = " + this.m_crcXmlPayload + "\n");
        }
        if (this.hasCrcBinAttach()) {
            buf.append(" Bin attachment Integrity= " + this.m_crcBinAttach + "\n");
        }
        if (this.hasStreamId()) {
            buf.append(" Stream ID               = " + this.m_streamId + "\n");
        }
        if (this.hasMessageId()) {
            buf.append(" Msg ID                  = " + this.m_messageId + "\n");
        }
        if (this.hasLatency()) {
            buf.append(" Latency Time Stamp      = " + this.m_latency + "\n");
        }

        return buf.toString();
    };


    solace.PubSubTools.MessageProperties = function MessageProperties () {

        this.xmlPayload = null;
        this.attachment = null;
        this.topic      = null;
        this.toolData   = new solace.PubSubTools.ToolData();
        this.partitionKeyList = null;
        this.messageObjectType = null;
    };

    solace.PubSubTools.MessageProperties.prototype = solace.PubSubTools.BaseProperties.prototype;


    solace.PubSubTools.MessageProperties.prototype.updateAttachmentForToolData = function () {

        var bytes = new Array(this.toolData.getEncodedSize());

        this.toolData.encode(bytes);

        // If the attachment doesn't exist or is too small to hold our tool data bytes,
        // we increase its size to fit.
        if (this.attachment === null || this.attachment.length < bytes.length) {
            this.attachment = solace.PubSubTools.utils.byteArrayToStr(bytes);
        } else {
            this.attachment = solace.PubSubTools.utils.byteArrayToStr(bytes) + this.attachment.substr(bytes.length, this.attachment.length);
        }
    };

}.apply(solace.PubSubTools));
