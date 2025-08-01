const storageUnitMapping = {
  Ki: "MB", Mi: "GB", Gi: "TB", Ti: "PB", Pi: "EB",
  K: "Mb", M: "Gb", G: "Tb", T: "Pb", P: "Eb",
}
const operationalStatuses = {
  U: "Up", D: "Down", N: "NA",
  u: "Up", d: "Down", n: "NA",
}
function processGD(lines, broker = {}) {
  ln = -1;
  while (++ln < lines.length) {
    let _TMP = cleanArr(lines[ln]);
    switch(true) {
// generic
        case /^Hostname\: /.test(lines[ln]):
          if (typeof broker.hostname === 'undefined')
            broker.hostname = _TMP[1];
          else if (broker.hostname != _TMP[1])
            throw new Error("hostname for gather diagnostics file does not match");
          break;
        case /^Solace PubSub\+ .+ Version/.test(lines[ln]):
          broker.model = _TMP[2];
          broker.solOS = _TMP[_TMP.length-1];
          break;
        case /^Platform\: /.test(lines[ln]):
          broker.platform = _TMP.splice(1).join(" ");
          break;
        case /^Chassis Product #\: /.test(lines[ln]):
          broker.hardware.chassisProductNumber = _TMP[3];
          break;
        case /^Chassis serial\: /.test(lines[ln]):
          broker.hardware.chassisSerial = _TMP[2];
          break;
        case /^Board serial\: /.test(lines[ln]):
          broker.hardware.boardSerial = _TMP[2];
          break;
        case /^BIOS Version\: /.test(lines[ln]):
          broker.bios = _TMP[2];
          break;
        case /^CPU[0-9] Version\: /.test(lines[ln]):
          broker.hardware.cpu.push(_TMP.splice(2).join(" "));
          break;
        case /^System Memory\: /.test(lines[ln]):
          broker.hardware.memory = _TMP.splice(2).join(" ");
          break;
        case /^Power redundancy configuration\: /.test(lines[ln]):
          broker.redundancy.powerConfig = _TMP.splice(3).join(" ");
          break;
// POWER
        case /^Operational power supplies\: /.test(lines[ln]):
          broker.power.operationalSupply = _TMP[3];
          break;
        case /^Power module 1\: /.test(lines[ln]):
          broker.power.status.powerMod1 = _TMP[3];
          break;
        case /^Power module 2\: /.test(lines[ln]):
          broker.power.status.powerMod2 = _TMP[3];
          break;
// HBA
        case /^Slot .\/.\: Host Bus Adapter Blade$/.test(lines[ln]):
          let hba = {};
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /Product #\: /.test(lines[ln]):
                hba.productNumber = _TMP[2];
                break;
              case /Serial #\: /.test(lines[ln]):
                hba.serialNumber = _TMP[2];
                break;
              case /POST Status: /.test(lines[ln]):
                hba.postStatus = _TMP[2];
                break;
            }
          }
          if (Object.keys(hba).length > 0)
            broker.hardware.hba.blade.push(hba);
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;

// ADB
        case /^Slot .\/.\: Assured Delivery Blade$/.test(lines[ln]):
          let adb = {};
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /Product #\: /.test(lines[ln]):
                adb.productNumber = _TMP[2];
                break;
              case /Serial #\: /.test(lines[ln]):
                adb.serialNumber = _TMP[2];
                break;
              case /POST Status: /.test(lines[ln]):
                adb.postStatus = _TMP[2];
                break;
            }
          }
          if (Object.keys(adb).length > 0)
            broker.hardware.adb.blade.push(adb);
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
        case /Power Module Details\:/.test(lines[ln]):
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /State\: /.test(lines[ln]):
                broker.hardware.adb.state = _TMP[1];
                break;
              case /Charge Level \:/.test(lines[ln]):
                broker.hardware.adb.chargeLevel = _TMP[_TMP.length-1];
                break;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// NAB
        case /^Slot .\/.\: Network Acceleration Blade$/.test(lines[ln]):
          let nab = {};
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /Product #\: /.test(lines[ln]):
                nab.productNumber = _TMP[2];
                break;
              case /Serial #\: /.test(lines[ln]):
                nab.serialNumber = _TMP[2];
                break;
              case /POST Status: /.test(lines[ln]):
                nab.postStatus = _TMP[2];
                break;
            }
          }
          if (Object.keys(nab).length > 0)
            broker.hardware.nab.blade.push(nab);
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// LUN
        case /^    Attached devices$/.test(lines[ln]):
          lun = {}, wwn = null;
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /LUN/.test(lines[ln]):
                if (wwn != null)
                  broker.hardware.lun[wwn] = lun;
                lun = {}, wwn = null;
                break;
              case /State\: /.test(lines[ln]):
                lun.state = _TMP[1];
              break;
              case /Size\: /.test(lines[ln]):
                lun.size = _TMP[1];
                break;
              case /WWN\: /.test(lines[ln]):
                wwn = _TMP[1];
                break;
            }
          }
          if (wwn != null)
            broker.hardware.lun[wwn] = lun;
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// SCALING
        case /^Scaling\:/.test(lines[ln]):
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /Max Connections\: /.test(lines[ln]):
                broker.scaling.maxConnections = parseInt(_TMP[_TMP.length-1]);
                break;
              case /Max Queue Messages\: /.test(lines[ln]):
                broker.scaling.maxQueueMsg = parseInt(_TMP[3]);
                break;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// STORAGE DEVICES FOR NON LUN (IE SOFTWARE)
        case /^Storage Devices/.test(lines[ln]):
          if (!hasProperty(broker.hardware, "diskMount"))
            broker.hardware.diskMount = {};
          let storage = size = units = null, contains = [];
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /contains\: /.test(lines[ln]):
                if (_TMP[1] == "spool")
                  broker.msgSpool.diskMount = storage;
                contains.push(_TMP.splice(1).join(" "));
                break;
              default:
                if (storage != null)
                  broker.hardware.diskMount[storage] = { size: `${size} ${units}`, contains: contains };
                contains = [], storage = _TMP[0], size = _TMP[1], units = storageUnitMapping[_TMP[2]];
                break;
            }
          }
          if (storage != null)
            broker.hardware.diskMount[storage] = { size: `${size} ${units}`, contains: contains };
          break;
// VRF MANAGEMENT
        case /^# CLI command: show ip vrf management$/.test(lines[ln]):
          ln = ln + 3;
          while (!lines[++ln].startsWith("Interface")) {
            // do nothing until Interface header
          }
          ln++;
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            if (_TMP[2] != "::/0") {
              enabled = (_TMP[5] == "U") ? true : false;
              state = operationalStatuses[_TMP[6]];
              broker.intf.vrfMgmt[_TMP[0]] = { type: _TMP[1], ipAddress: _TMP[2], enabled: enabled, state: state, };
              broker.intf.vrfMgmtEnabled = broker.intf.vrfMgmtEnabled || enabled;
            }
          }
          break;
// VRF MSG BACKBONE
        case /^# CLI command: show ip vrf msg-backbone$/.test(lines[ln]):
          ln = ln + 3;
          while (!lines[++ln].startsWith("Interface")) {
            // do nothing until Interface header
          }
          ln++;
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
            if (_TMP[2] != "::/0") {
              enabled = (_TMP[5] == "U") ? true : false;
              state = operationalStatuses[_TMP[6]];
              broker.intf.vrfMsg[_TMP[0]] = { type: _TMP[1], ipAddress: _TMP[2], enabled: enabled, state: state, };
              broker.intf.vrfMsgEnabled = broker.intf.vrfMsgEnabled || enabled;
            }
          }
          break;
// REDUNDANCY
        case /^# CLI command\: show redundancy detail$/.test(lines[ln]):
          ln = ln + 3;
          while (!lines[++ln].startsWith("#")) {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /^Configuration Status .+ \: /.test(lines[ln]):
                broker.redundancy.enabled = (_TMP[_TMP.length-1] == "Enabled") ? true : false;
                break;
              case /^Redundancy Status .+ \: /.test(lines[ln]):
                broker.redundancy.status = _TMP[_TMP.length-1];
                break;
              case /Role .+ \: /.test(lines[ln]):
                broker.redundancy.role = _TMP[_TMP.length-1];
                break;
              case /Last Failure Reason .+ \: /.test(lines[ln]):
                broker.redundancy.lastFailure = _TMP.splice(4).join(" ");
                break;
              case /Last Failure Time .+ \: /.test(lines[ln]):
                broker.redundancy.lastFailureTime = _TMP.splice(4).join(" ");
                break;
              case /^Mate Router Name .+ \: /.test(lines[ln]):
                broker.redundancy.mate = _TMP[_TMP.length-1];
                break;
              case /^ADB Link To Mate .+ \: /.test(lines[ln]):
                broker.redundancy.adbMateLink = _TMP[_TMP.length-1];
                break;
              case /^ADB Hello To Mate .+ \: /.test(lines[ln]):
                broker.redundancy.adbMateHello = _TMP[_TMP.length-1];
                break;
              case /^Redundancy Interface Status /.test(lines[ln]):
                broker.redundancy.intfStatus = _TMP[_TMP.length-1];
                break;
              case /^Message Spool Status\: /.test(lines[ln]):
                broker.redundancy.msgSpoolStatus = _TMP[_TMP.length-1];
                break;
              case /^Activity Status\: /.test(lines[ln]):
                broker.redundancy.activityStatus = _TMP[2];
                break;
              case /Operational Status /.test(lines[ln]):
                broker.redundancy.operationalStatus = _TMP[_TMP.length-1];
                break;
              case /Redundancy Config Status /.test(lines[ln]):
                broker.redundancy.configStatus = _TMP[_TMP.length-1];
                break;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// HARDWARE MESSAGE SPOOL DETAIL
        case /^# CLI command\: show message-spool detail$/.test(lines[ln]):
          ln = ln + 4;
          while (!lines[++ln].startsWith("#")) {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /^Config Status: /.test(lines[ln]):
                broker.msgSpool.enabled = (_TMP[2] == "Enabled") ? true : false;
                broker.msgSpool.role = _TMP[3].replace(/[\(\)]/g, "");
                break;
              case /^Maximum Spool Usage\:/.test(lines[ln]):
                broker.msgSpool.maxUsage = _TMP[3];
                break;
              case /^Disk Array WWN\: /.test(lines[ln]):
                broker.msgSpool.diskArrayWwn = _TMP[_TMP.length-1];
                break;
              case /^Operational Status\: /.test(lines[ln]):
                broker.msgSpool.operationalStatus = _TMP[2];
                break;
              case /^Synchronization Status\: /.test(lines[ln]):
                broker.msgSpool.syncStatus = _TMP[2];
                break;
              case /^Max Queue Messages\: /.test(lines[ln]):
                broker.scaling.maxQueueMsg = _TMP[3];
                break;
              case /^Queue Message Resource Utilization\: /.test(lines[ln]):
                broker.msgSpool.utilization.queueMsg = parseFloat(_TMP[4].replace("%", ""));
                break;
              case /^Transaction Resource Utilization\: /.test(lines[ln]):
                broker.msgSpool.utilization.txn = parseFloat(_TMP[3].replace("%", ""));
                break;
              case /^Delivered Unacked Msgs Utilization\: /.test(lines[ln]):
                broker.msgSpool.utilization.unackedMsg = parseFloat(_TMP[4].replace("%", ""));
                break;
              case /^Spool Files Utilization\: /.test(lines[ln]):
                broker.msgSpool.utilization.spoolFiles = parseFloat(_TMP[3].replace("%", ""));
                break;
              case /^Active Disk Partition Usage\: /.test(lines[ln]):
                broker.msgSpool.utilization.activeDiskPartition = parseFloat(_TMP[4].replace("%", ""));
                break;
              case /^Standby Disk Partition Usage\: /.test(lines[ln]):
                broker.msgSpool.utilization.standbyDiskPartition = parseFloat(_TMP[4].replace("%", ""));
                break;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// CONFIG-SYNC
        case /^# CLI command: show config-sync$/.test(lines[ln]):
          ln = ln + 4;
          if (typeof broker.configSync === 'undefined')
            broker.configSync = {};
          while (!lines[++ln].startsWith("#")) {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /^Admin Status .+ \: /.test(lines[ln]):
                broker.configSync.enabled = (_TMP[_TMP.length-1] == "Enabled") ? true : false;
                break;
              case /^Oper Status .+ \: /.test(lines[ln]):
                broker.configSync.operationalStatus = _TMP[_TMP.length-1];
                break;
              case /^SSL Enabled .+ \: /.test(lines[ln]):
                broker.configSync.sslEnabled = (_TMP[_TMP.length-1] == "No") ? false : true;
                break;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
        case /^# CLI command: show config-sync database detail$/.test(lines[ln]):
          ln = ln + 3;
          if (typeof broker.configSync === 'undefined')
            broker.configSync = {};
          while (!lines[++ln].startsWith("#")) {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /^Router/.test(lines[ln]):
                while (lines[++ln] != "") {
                  _TMP = cleanArr(lines[ln]);
                  switch (true) {
                    case /^Sync State .+ \:/.test(lines[ln]):
                      broker.configSync.routerSyncState = _TMP[3];
                      break;
                    case /^Time in State .+ \:/.test(lines[ln]):
                      broker.configSync.routerTimeInState = _TMP.splice(4).join(" ");
                      break;
                    case /^Last Result .+ \:/.test(lines[ln]):
                      broker.configSync.routerLastResult = _TMP[3];
                      break;
                  }
                }
                updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
                break;
              case /^Message-VPN/.test(lines[ln]):
                let vpn = _TMP[2];
                if (typeof broker.vpn[vpn] === 'undefined')
                  broker.vpn[vpn] = { configSync: {}, };
                if (typeof broker.vpn[vpn].configSync === 'undefined')
                  broker.vpn[vpn].configSync = {};
                while (lines[++ln] != "") {
                  _TMP = cleanArr(lines[ln]);
                  switch (true) {
                    case /^Sync State .+ \:/.test(lines[ln]):
                      broker.vpn[vpn].configSync.syncState = _TMP[3];
                      break;
                    case /^Time in State .+ \:/.test(lines[ln]):
                      broker.vpn[vpn].configSync.timeInState = _TMP.splice(4).join(" ");
                      break;
                    case /^Last Result .+ \:/.test(lines[ln]):
                      broker.vpn[vpn].configSync.lastResult = _TMP[3];
                      break;
                  }
                }
                updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
                break;
            }
          }
          break;
// REPLICATION
        case /^# CLI command: show replication stats/.test(lines[ln]):
          ln = ln + 4;
          repLoop: while (!lines[++ln].startsWith("#")) {
            _TMP = cleanArr(lines[ln]);
            switch (true) {
              case /^Replication Mate\: /.test(lines[ln]):
                broker.replication.mate = _TMP[2];
                break;
              case /^    Admin State\: /.test(lines[ln]):
                broker.replication.enabled = (_TMP[2] == "Enabled") ? true : false;
                break;
              case /^    State:/.test(lines[ln]):
                broker.replication.state = _TMP[1];
                break repLoop;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
        case /^# CLI command: show interface detail$/.test(lines[ln]):
          ln = ln + 3;
          while (!lines[++ln].startsWith("#")) {
            _TMP = cleanArr(lines[ln]);
            if (/^Interface\:/.test(lines[ln])) {
              let intf = _TMP[1];
              if (typeof broker.intf[intf] === 'undefined')
                broker.intf[intf] = {};
              intfLoop: while (!lines[++ln].startsWith("Interface")) {
                _TMP = cleanArr(lines[ln]);
                if (/^  Operational State\:/.test(lines[ln])) {
                  broker.intf[intf].state = _TMP[2];
                  break intfLoop;
                }
              }
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// NTP
        case /^NTP Reachable:/.test(lines[ln]):
          broker.ntp.reachable = (_TMP[2] == "Yes") ? true : false;
          break;
        case /^No current alarms in the system./.test(lines[ln]):
          broker.alarms = "(none)";
          break;
        case /^# CLI command: show log no-subscription-match wide/.test(lines[ln]):
          ln = ln + 8;
          while (!lines[++ln].startsWith("#")) {
            if (/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}\d{2})?)/i.test(lines[ln])) {
              let client = lines[ln].substr(26, 24).trim(), user = lines[ln].substr(51, 24).trim(), vpn = lines[ln].substr(76, 24).trim(), topic = lines[ln].substr(101).trim();
              while (lines[++ln].startsWith(" ")) {
                client += lines[ln].substr(26, 24).trim(), user += lines[ln].substr(51, 24).trim(), vpn += lines[ln].substr(76, 24).trim(), topic += lines[ln].substr(101).trim();
              }
              if (typeof broker.vpn[vpn] === 'undefined')
                broker.vpn[vpn] = { unmatchedSubscriptions: {}, };
              else if (typeof broker.vpn[vpn].unmatchedSubscriptions === 'undefined')
                broker.vpn[vpn].unmatchedSubscriptions = {};
              if (typeof broker.vpn[vpn].unmatchedSubscriptions[topic] === 'undefined')
                broker.vpn[vpn].unmatchedSubscriptions[topic] = { sentBy: [], count: 0 };
              if (!broker.vpn[vpn].unmatchedSubscriptions[topic].sentBy.includes(client))
                broker.vpn[vpn].unmatchedSubscriptions[topic].sentBy.push(client);
              broker.vpn[vpn].unmatchedSubscriptions[topic].count++;
              ln--;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// SSL Certificate
        case /^# CLI command: show ssl server-certificate detail/.test(lines[ln]):
          ln = ln + 3;
          sslLoop: while (!lines[++ln].startsWith("#")) {
            _TMP = cleanArr(lines[ln]);
            if (_TMP[0] == "Validity") {
              while (!/^        [a-zA-Z]/.test(lines[++ln])) {
                let dayNum = lines[ln].substr(28,2).trim();
                let monthNum = "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(lines[ln].substr(24,3)) / 3 + 1;
                let yearNum = lines[ln].substr(40,4);
                let time = lines[ln].substr(31,8);
                if (lines[ln].substr(16,6) == "Before")
                  broker.ssl.validAfter = `${yearNum}-${monthNum}-${dayNum}T${time}`
                else if (lines[ln].substr(16,5) == "After")
                  broker.ssl.validBefore = `${yearNum}-${monthNum}-${dayNum}T${time}`
              }
              break sslLoop;
            }
          }
          updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
          break;
// MESSAGE VPN STATE
        case /^# CLI command: show message-vpn */.test(lines[ln]):
          ln = ln + 9;
          while (lines[++ln] != "") {
            _TMP = cleanArr(lines[ln]);
          }
          break;
        case /^/.test(lines[ln]):
          break;
        case /^/.test(lines[ln]):
          break;
    }
  }
  updateStatus(ln, lines.length, "gatherDiagLinesProcessed");
  return broker;
}
