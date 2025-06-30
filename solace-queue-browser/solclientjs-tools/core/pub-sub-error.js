// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {

    /**
     * @class
     * An error thrown by the application when an error is encountered.
     * @param {string} message
     */
    solace.PubSubTools.PubSubError = function (message) {
        this.name = "PubSubError";
        this.message = (message || "");
    };

    solace.PubSubTools.PubSubError.prototype = new Error();
    
    solace.PubSubTools.PubSubError.prototype.toString = function() {
        var buf = new solace.StringBuffer(this.name);

        buf.append(": ");
        buf.append(this.message||"");

        return buf.toString();
    };

}.apply(solace.PubSubTools));