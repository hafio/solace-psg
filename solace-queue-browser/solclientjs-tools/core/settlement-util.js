// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};

(function() {
    solace.PubSubTools.SettlementUtil = function SettlementUtil(pattern) {
        this.m_iOutcome = 0;
        this.m_messageOutcomes = [];

        for (var i = 0; i < pattern.length; i++) {
            if (pattern.toUpperCase().charAt(i) === 'A') {
                this.m_messageOutcomes.push(solace.MessageOutcome.ACCEPTED);
            } else if (pattern.toUpperCase().charAt(i) === 'R') {
                this.m_messageOutcomes.push(solace.MessageOutcome.REJECTED);
            } else if (pattern.toUpperCase().charAt(i) === 'F') {
                this.m_messageOutcomes.push(solace.MessageOutcome.FAILED);
            }
        }
    };

    solace.PubSubTools.SettlementUtil.prototype.GenNextOutcome = function () {
        var outcome = this.m_messageOutcomes[this.m_iOutcome++];
        this.m_iOutcome %= this.m_messageOutcomes.length;
        return outcome;
    };
}.apply(solace.PubSubTools));