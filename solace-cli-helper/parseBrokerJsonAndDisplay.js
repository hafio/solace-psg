const osSupportDateVersion = {
  "10.1.0": new Date(2023, 06, 14),  "10.1.1": new Date(2025, 08, 15),
  "10.2.0": new Date(2023, 09, 31),  "10.2.1": new Date(2025, 11, 15),
  "10.3.0": new Date(2024, 00, 31),  "10.3.1": new Date(2026, 02, 15),
  "10.4.0": new Date(2024, 03, 25),  "10.4.1": new Date(2026, 05, 15),
  "10.5.0": new Date(2024, 06, 26),  "10.5.1": new Date(2026, 08, 15),
  "10.6.0": new Date(2024, 09, 31),  "10.6.1": new Date(2026, 11, 15),
  "10.7.0": new Date(2025, 00, 15),  "10.7.1": new Date(2027, 02, 15),
  "10.8.0": new Date(2025, 03, 30),  "10.8.1": new Date(2027, 05, 15),
                                     "10.9.1": new Date(2027, 08, 15),
  "10.10.0": new Date(2025, 09, 31), "10.10.1": new Date(2027, 11, 15),
  "10.11.0": new Date(2026, 00, 31), "10.11.1": new Date(2028, 02, 15),
  "10.12.0": new Date(2026, 03, 30),
  
  "10.25.0": new Date(2027, 05, 30)
};
function getTechnicalSupportDate(version) {
  versionParts = version.split(".")
  if (versionParts.length < 3)
    throw new Error("Invalid version provided " + version);
  version = versionParts.splice(0,3).join(".");
  let supportDate = osSupportDateVersion[version];
  return (typeof supportDate === 'undefined') ? null : supportDate;
}
function checkDateAfterRange(date, year = 0, month = 0, day = 0) {
  // check if the date provided is after today + difference
  dt = new Date();
  dtYear = dt.getFullYear() + year, dtMonth = dt.getMonth() + month, dtDay = dt.getDate() + day;
  dt = new Date(dtYear, dtMonth, dtDay);
  return (date > dt);
}
function checkDateBeforeRange(date, year = 0, month = 0, day = 0) {
  // check if the date provided is after today + difference
  dt = new Date();
  dtYear = dt.getFullYear() - year, dtMonth = dt.getMonth() - month, dtDay = dt.getDate() - day;
  dt = new Date(dtYear, dtMonth, dtDay);
  return (date < dt);
}

let allList = { acl: [], cp: [], cu: [], vpn: [], }

async function parseBrokerJsonAndDisplay(broker) {
  allList = { acl: [], cp: [], cu: [], vpn: [], }
  initializeMainPanel();
  await sleep(0);
  document.getElementById("naviMenu").innerHTML = "";
  await sleep(0);
  aclProfileList = [], clientProfileList = [], clientUsernameList = [], problems = [];
  
  document.getElementById("hostnamePanel").textContent = "Loading " + broker.hostname + "...";
  document.getElementById("hostnamePanel").classList.remove("no-display");
  
  // broker Summary
  addEventTime("Broker Summary", broker);
  solPlatform = showOS = solCPU = solMem = "";
  if (hasProperty(broker, 'platform'))
    solPlatform = broker.platform;
  if (hasProperty(broker, 'solOS')) {
    let osSupported = checkDateAfterRange(getTechnicalSupportDate(broker.solOS), 0);
    let osSupportLess6Mon = checkDateAfterRange(getTechnicalSupportDate(broker.solOS), 0, 6);
    let osSupportLess1Year = checkDateAfterRange(getTechnicalSupportDate(broker.solOS), 1);
    if (!osSupported) {
      showOS = `<span class="error">${broker.solOS}</span>`;
      problems.push(["HIGH", "Sol OS Version", "Solace OS is already out of support."]);
    } else if (!osSupportLess6Mon) {
      showOS = `<span class="error">${broker.solOS}</span>`;
      problems.push(["HIGH", "Sol OS Version", "Solace OS will be out of support within 6 months."]);
  } else if (!osSupportLess1Year) {
      showOS = `<span class="warn">${broker.solOS}</span>`;+
      problems.push(["MEDIUM", "Sol OS Version", "Solace OS will be out of support within 1 year."]);
    } else
      showOS = broker.solOS;
  }
  if (hasProperty(broker, 'hardware.cpu'))
    solCPU = broker.hardware.cpu.join(", ");
  if (hasProperty(broker, 'hardware.memory'))
    solMem = broker.hardware.memory
  storHeader = "Storage Size", storSize = "";
  if (hasProperty(broker.msgSpool, 'diskArrayWwn') && hasProperty(broker.hardware.lun, broker.msgSpool.diskArrayWwn)) {
    storHeader = "LUN Size"
    storSize = broker.hardware.lun[broker.msgSpool.diskArrayWwn].size;
  } else if (hasProperty(broker.msgSpool, 'diskMount') && hasProperty(broker.hardware.diskMount, broker.msgSpool.diskMount)) {
    storHeader = "Disk Size"
    storSize = broker.hardware.diskMount[broker.msgSpool.diskMount].size;
  }
  addEventTime("Broker Summary DOM", broker);
  // generic
  // TODO LUN CAN BE MULTIPLE BY ADDRESS - NEED TO FIX PARSER AND DISPLAY
  overwriteTableHeaders("brokerSummaryTableGen", ["Hostname", "Platform", "OS", "CPU", "Memory", storHeader, ]);
  addRowToTable("brokerSummaryTableGen", [broker.hostname, solPlatform, showOS, solCPU, solMem, storSize ]);
  await sleep(0);
  
  // blades
  addEventTime("Broker Hardware Blade", broker);
  chsPN = chsSrl = nabPN = adbPN = hbaPN = "";
  if (hasProperty(broker, 'hardware.chassisProductNumber'))
    chsPN = broker.hardware.chassisProductNumber;
  if (hasProperty(broker, 'hardware.chassisSerial'))
    chsSrl = broker.hardware.chassisSerial;
  if (hasProperty(broker, 'hardware.nab.blade') && hasProperty(broker.hardware.nab.blade[0], 'productNumber'))
    nabPN = broker.hardware.nab.blade[0].productNumber;
  if (hasProperty(broker, 'hardware.adb.blade') && hasProperty(broker.hardware.adb.blade[0], 'productNumber'))
    adbPN = broker.hardware.adb.blade[0].productNumber;
  if (hasProperty(broker, 'hardware.hba.blade') && hasProperty(broker.hardware.hba.blade[0], 'productNumber'))
    hbaPN = broker.hardware.hba.blade[0].productNumber;
  overwriteTableHeaders("brokerSummaryTableHw", ["Hostname", "Chassis Product #", "Chassis Serial", "NAB Model", "ADB Model", "HBA Model"]);
  // TODO NAB, ADB, HBA display only first number
  addRowToTable("brokerSummaryTableHw", [broker.hostname, chsPN, chsSrl, nabPN, adbPN, hbaPN]);
  await sleep(0);
  
  // LAG/VRF & scaling
  addEventTime("Broker Hardware VRF Management", broker);
  vrfMgmtDetails = "";
  vrfMsgDetails = "";
  if (hasProperty(broker.intf, 'vrfMgmt')) {
    if (Object.keys(broker.intf.vrfMgmt).length > 0 && broker.intf.vrfMgmtEnabled)
      vrfMgmt = "Configured & Enabled";
    else if (Object.keys(broker.intf.vrfMgmt).length == 0) {
      vrfMgmt = `<span class="warn">Not configured</span>`;
      problems.push(["HIGH", "VRF Management", "VRF Management interface is not configured."]);
    } else if (!broker.intf.vrfMgmtEnabled) {
      vrfMgmt = `<span class="warn">Not enabled</span>`;
      problems.push(["HIGH", "VRF Management", "VRF Management is not enabled."]);
    }
    for (let vrf of Object.keys(broker.intf.vrfMgmt)) {
      vrfMgmtDetails += `${vrf}: ${broker.intf.vrfMgmt[vrf].ipAddress}<br/>`;
    }
  } else
    vrfMgmt = "";
  addEventTime("Broker Hardware VRF Message Backbone", broker);
  if (hasProperty(broker.intf, 'vrfMsg')) {
    if (Object.keys(broker.intf.vrfMsg).length > 0 && broker.intf.vrfMsgEnabled)
      vrfMsg = "Configured & Enabled";
    else if (Object.keys(broker.intf.vrfMsg).length == 0) {
      vrfMsg = `<span class="warn">Not configured</span>`;
      problems.push(["HIGH", "VRF Message Backbone", "VRF Message Backbone interface is not configured."]);
    } else if (!broker.intf.vrfMsgEnabled) {
      vrfMsg = `<span class="warn">Not enabled</span>`;
      problems.push(["HIGH", "VRF Message Backbone", "VRF Message Backbone is not enabled."]);
    }
    for (let vrf of Object.keys(broker.intf.vrfMsg)) {
      vrfMsgDetails += `${vrf}: ${broker.intf.vrfMsg[vrf].ipAddress}<br/>`;
    }
  } else
    vrfMsg = "";
  addEventTime("Broker Message Spool Operational Status", broker);
  msgSpoolOpStatus = broker.msgSpool.operationalStatus;
  if (hasProperty(broker.redundancy, 'enabled')) {
    if (broker.redundancy.enabled && broker.redundancy.role == "Primary" && broker.msgSpool.operationalStatus != "AD-Active") {
      msgSpoolOpStatus = `<span class="warn">${broker.msgSpool.operationalStatus}</span>`;
      problems.push(["LOW", "Redundancy Active Node", `Primary Redundancy Node (${broker.hostname}) is not active.`]);
    } else if (broker.redundancy.enabled && broker.redundancy.role == "Backup" && broker.msgSpool.operationalStatus != "AD-Standby") {
      msgSpoolOpStatus = `<span class="warn">${broker.msgSpool.operationalStatus}</span>`;
      problems.push(["LOW", "Redundancy Active Node", `Backup Redundancy Node (${broker.hostname}) is active.`]);
    }
  }
  overwriteTableHeaders("brokerSummaryTableIntf", ["Hostname", "Mgmt LAG", "Msg Backbone LAG", "Max Connections", "Max Queue Messages", "Max Spool Usage (MB)", "Msg Spool Status"]);
  addRowToTable("brokerSummaryTableIntf", [broker.hostname, vrfMgmt, vrfMsg, broker.scaling.maxConnections, broker.scaling.maxQueueMsg, broker.msgSpool.maxUsage, msgSpoolOpStatus]);
  
  //LAG details
  overwriteTableHeaders("brokerSummaryTableLag", ["Hostname", "VRF Mgmt Interfaces","VRF Msg Backbone Interfaces"]);
  addRowToTable("brokerSummaryTableLag", [broker.hostname, vrfMgmtDetails, vrfMsgDetails]);
  
  //broker redundancy
  addEventTime("Broker Redundancy", broker);
  if (broker.redundancy.enabled)
    rddc = "Enabled";
  else {
    rddc = `<span class="error">Disabled</span>`;
    problems.push(["HIGH", "Redundancy", "Broker does not have redundancy."]);
  }
  if (broker.redundancy.status == "Up")
    rddcStatus = broker.redundancy.status;
  else {
    rddcStatus = `<span class="error">${broker.redundancy.status}</span>`
    problems.push(["HIGH", "Redundancy", "Broker reundancy has issue (status != up)."]);
  }
  if (broker.configSync.enabled)
    cfgsync = "Enabled";
  else {
    cfgsync = `<span class="error">Disabled</span>`;
    problems.push(["HIGH", "Config Sync", "Broker config-sync is disabled."]);
  }
  if (broker.configSync.sslEnabled)
    cfgsyncssl = "Enabled";
  else {
    cfgsyncssl = `<span class="warn">Disabled</span>`;
    problems.push(["LOW", "Config Sync SSL", "Broker config-sync SSL is not enabled."]);
  }
  role = (hasProperty(broker.redundancy, 'role')) ? broker.redundancy.role : "";
  overwriteTableHeaders("brokerSummaryTableRdcy", ["Hostname", "Redundancy (Rd)", "Rd. Mate", "Rd. Status", "Rd. Role", "Config Sync", "Config Sync SSL"]);
  addRowToTable("brokerSummaryTableRdcy", [broker.hostname, rddc, broker.redundancy.mate, rddcStatus, capitalizeWord(role), cfgsync, cfgsyncssl ]);
  
  // TODO ADD REPLICATION PSK
  //broker replication
  addEventTime("Broker Replication", broker);
  if (!hasProperty(broker, 'replication.enabled'))
    datRep = "";
  else if (broker.replication.enabled)
    datRep = "Enabled";
  else {
    datRep =`<span class="error">Disabled</span>`;
    problems.push(["HIGH", "Broker Replication", "Broker does not have Data Replication."]);
  }
  if (broker.replication.enabled && broker.msgSpool.operationalStatus == "AD-Active" && broker.replication.state != "up") {
    datRepStatus = `<span class="error">` + capitalizeWord(broker.replication.state) + `</span>`
    problems.push(["HIGH", "Broker Replication", "Broker Data Replication has issue (status != up)."]);
  } else {
    datRepStatus = broker.replication.state;
  }
  if (broker.replication.sslEnabled)
    datRepSsl = "Enabled";
  else {
    datRepSsl =`<span class="warn">Disabled</span>`;
    problems.push(["LOW", "Broker Replication SSL", "Broker does not have SSL Data Replication."]);
  }
  
  overwriteTableHeaders("brokerSummaryTableRep", ["Hostname", "Data Replication (DR)", "DR Mate", "DR State", "DR SSL"]);
  addRowToTable("brokerSummaryTableRep", [broker.hostname, datRep, broker.replication.mate, datRepStatus, datRepSsl]);
  
  overwriteTableHeaders("vpnSummaryTable", ["VPN", "State", "Basic Authentication", "Client Certificate", "OAuth2", "Authorization"]);
  overwriteTableHeaders("vpnSummaryReplTable", ["VPN", "Replication (Rep)", "SSL", "Ack Propagation", "Rep Mode", "Reject Msg on Discard"]);
  overwriteTableHeaders("vpnCountSummaryTable", ["VPN", "ACL Profiles", "Client Profiles", "Client Usernames", "Bridges", "Queues", "Topic Endpoints"]);
  overwriteTableHeaders("vpnSummaryLimitsTable", ["VPN", "Max Connections", "Max Spool Usage", "Max Egress", "Max Ingress", "Max Queue/Topic Endpoints"]);
  
  // loop through each VPN to get the details
  for (vpn in broker.vpn) {
    addEventTime(`${vpn} VPN START`, broker);
    let vpnAuth = vpnRepl = maxConn = maxSpool = maxEg = maxIng = maxEndpts = repSsl = repRejectMsg = null;
    allList.vpn.push(vpn);
    overwriteTableHeaders("aclSummaryTable", ["ACL Profile", ...allList.vpn]);
    overwriteTableHeaders("cpSummaryTable", ["Client Profile", ...allList.vpn]);
    overwriteTableHeaders("cuSummaryTable", ["Client Username", ...allList.vpn]);

    // vpn summary
    addEventTime("VPN SUMMARY", broker);
    if (!hasProperty(broker.vpn[vpn], 'authentication.basic.enabled'))
      vpnAuth = "";
    else if (!broker.vpn[vpn].authentication.basic.enabled)
      vpnAuth = "Disabled";
    else if (broker.vpn[vpn].authentication.basic.authType == "none") {
      vpnAuth = "<span class=\"error\">None</span>";
      problems.push(["HIGH", "VPN Authentication", `Msg VPN ${vpn} doesn't have authentication enabled.`]);
    } else {
      vpnAuth = capitalizeWord(broker.vpn[vpn].authentication.basic.authType);
    }
    if (hasProperty(broker.vpn[vpn], 'authentication.clientCertificate.enabled'))
      clientCertificate = (broker.vpn[vpn].authentication.clientCertificate.enabled) ? "Enabled" : "Disabled";
    else
      clientCertificate = "";
    if (hasProperty(broker.vpn[vpn], 'authentication.oauth.enabled'))
      oauth = (broker.vpn[vpn].authentication.oauth.enabled) ? "Enabled" : "Disabled";
    else
      oauth = "";
    if (hasProperty(broker.vpn[vpn], 'enabled'))
      vpnEnabled = (broker.vpn[vpn].enabled) ? "Enabled" : "Disabled";
    else
      vpnEnabled = "";
    addRowToTable("vpnSummaryTable", [
      vpn,
      vpnEnabled,
      vpnAuth,
      clientCertificate,
      oauth,
      (hasProperty(broker.vpn[vpn], 'authorization.authType')) ? capitalizeWord(broker.vpn[vpn].authorization.authType) : "",
    ]);
    if (!hasProperty(broker.vpn[vpn], 'replication.enabled'))
      vpnRepl = "";
    else if (broker.vpn[vpn].replication.enabled)
      vpnRepl = "Enabled";
    else if (broker.vpn[vpn].enabled) {
      vpnRepl = "<span class=\"warn\">Disabled</span>",
      problems.push(["HIGH", "VPN Replication", `Msg VPN ${vpn} does not have replication enabled.`]);
    } else
      vpnRepl = "Disabled";
    if (!hasProperty(broker.vpn[vpn], 'replication.sslEnabled'))
      vpnReplSsl = "";
    else if (broker.vpn[vpn].replication.sslEnabled) {
      vpnReplSsl = "Enabled";
    } else if (broker.vpn[vpn].replication.enabled) {
      vpnReplSsl = "<span class=\"warn\">Disabled</span>",
      problems.push(["LOW", "VPN Replication SSL", `Msg VPN ${vpn}'s replication is not SSL enabled.`]);
    } else
      vpnReplSsl = "Disabled";
    if (!hasProperty(broker.vpn[vpn], 'replication.ackPropagation'))
      ackPropagation = "";
    else 
      ackPropagation = (broker.vpn[vpn].replication.ackPropagation) ? "Enabled" : "Disabled";
    if (!hasProperty(broker.vpn[vpn], 'replication.rejectMsgOnDiscard'))
      rejectMsgOnDiscard = "";
    else 
      rejectMsgOnDiscard = (broker.vpn[vpn].replication.rejectMsgOnDiscard) ? "Enabled" : "Disabled";
    if (hasProperty(broker.vpn[vpn], 'replication.txnRepMode'))
      repTxnMode = capitalizeWord(broker.vpn[vpn].replication.txnRepMode);
    else
      repTxnMode = "";
    addRowToTable("vpnSummaryReplTable", [
      vpn,
      vpnRepl,
      vpnReplSsl,
      ackPropagation,
      repTxnMode,
      rejectMsgOnDiscard,
    ]);
    addRowToTable("vpnCountSummaryTable", [
      vpn,
      (hasProperty(broker.vpn[vpn], 'aclProfileCount')) ? broker.vpn[vpn].aclProfileCount : "",
      (hasProperty(broker.vpn[vpn], 'clientProfileCount')) ? broker.vpn[vpn].clientProfileCount : "",
      (hasProperty(broker.vpn[vpn], 'clientUsernameCount')) ? broker.vpn[vpn].clientUsernameCount : "",
      (hasProperty(broker.vpn[vpn], 'bridgeCount')) ? broker.vpn[vpn].bridgeCount : "",
      (hasProperty(broker.vpn[vpn], 'queueCount')) ? broker.vpn[vpn].queueCount : "",
      (hasProperty(broker.vpn[vpn], 'topicEndpointCount')) ? broker.vpn[vpn].topicEndpointCount : "",
    ]);
    // vpn limits
    addEventTime("VPN LIMITS", broker);
    maxConn = maxSpool = maxEg = maxIng = maxEndpts = "";
      // max connections
    if (!hasProperty(broker.vpn[vpn], 'maxConnections'))
      maxConn = "";
    else if (broker.vpn[vpn].enabled && broker.vpn[vpn].cumulativeMaxConnectionsFromClientUsername > broker.vpn[vpn].maxConnections) {
        maxConn = `<span class="warn">${broker.vpn[vpn].maxConnections}</span>`;
        problems.push(["LOW", "VPN Max Connections", `Msg VPN ${vpn}'s Max Connections is less than sum of all Client Usernames' Client Profile Max Connection.`]);
    } else
        maxConn = broker.vpn[vpn].maxConnections;
      // max spool usage
    if (!hasProperty(broker.vpn[vpn], 'maxSpoolUsage'))
      maxSpool = "";
    else if (broker.vpn[vpn].enabled && broker.vpn[vpn].cumulativeMaxSpoolUsage > broker.vpn[vpn].maxSpoolUsage) {
        maxSpool = `<span class="warn">${broker.vpn[vpn].maxSpoolUsage}</span>`;
        problems.push(["LOW", "VPN Max Spool Usage", `Msg Vpn ${vpn}'s Max Spool Usage is less than sum of all Endpoints' Max Spool Usage.`]);
    } else
        maxSpool = broker.vpn[vpn].maxSpoolUsage;
      // max egress
    if (!hasProperty(broker.vpn[vpn], 'maxEgress'))
      maxEg = "";
    else if (broker.vpn[vpn].enabled && broker.vpn[vpn].maxEgress >= 1000) {
        maxEg = `<span class="warn">${broker.vpn[vpn].maxEgress}</span>`;
        problems.push(["LOW", "VPN Max Egress", `Msg Vpn ${vpn}'s Max Egress is default / excess connections.`]);
    } else
        maxEg = broker.vpn[vpn].maxEgress;
      // max ingress
    if (!hasProperty(broker.vpn[vpn], 'maxIngress'))
      maxIng = "";
    else if (broker.vpn[vpn].enabled && broker.vpn[vpn].maxIngress >= 1000) {
        maxIng = `<span class="warn">${broker.vpn[vpn].maxIngress}</span>`;
        problems.push(["LOW", "VPN Max Ingress", `Msg Vpn ${vpn}'s Max Ingress is default / excess connections.`]);
    } else
        maxIng = broker.vpn[vpn].maxIngress;
      // max end points
    if (!hasProperty(broker.vpn[vpn], 'maxEndpoints'))
      maxEndpts = "";
    else if (broker.vpn[vpn].enabled && broker.vpn[vpn].maxEndpoints == 1000) {
        maxEndpts = `<span class="warn">${broker.vpn[vpn].maxEndpoints}</span>`;
        problems.push(["LOW", "VPN Max Endpoints", `Msg Vpn ${vpn}'s Max Endpoints is default.`]);
    } else
        maxEndpts = broker.vpn[vpn].maxEndpoints;

    addRowToTable("vpnSummaryLimitsTable", [
        vpn,
        maxConn,
        maxSpool,
        maxEg,
        maxIng,
        maxEndpts,
    ]);

    // VPN Specific section
    addHeaderToDOM(`Message VPN ${vpn}:`, 1, "vpns");

    // bridge
    // TODO add connect-order to table to show errors
    addEventTime("VPN BRIDGE", broker);
    tblDom = document.createElement("table");
    overwriteTableHeaders(tblDom, ["Bridge", "Remote VPN", "State", "Auth Scheme", "User", "SSL"]);
    for (bridge in broker.vpn[vpn].bridge) {
        if (broker.vpn[vpn].bridge[bridge].remoteVpnSslEnabled.length == 2) {
            remoteVpnSsl = "<span class=\"warn\">Mixed</span>";
            problems.push(["LOW", "VPN Bridge SSL", `${bridge} bridge in Msg VPN ${vpn} have ssl & non-ssl connection(s).`]);
        } else if (broker.vpn[vpn].bridge[bridge].remoteVpnSslEnabled[0])
            remoteVpnSsl = "Enabled";
        else {
            remoteVpnSsl = "<span class=\"warn\">Disabled</span>";
            problems.push(["LOW", "VPN Bridge SSL", `${bridge} bridge in Msg VPN ${vpn} only has non-ssl connection(s).`]);
        }
        addRowToTable(tblDom, [
            bridge,
            broker.vpn[vpn].bridge[bridge].remoteVpnNames.join(", "),
            (broker.vpn[vpn].bridge[bridge].enabled) ? "Enabled" : "Disabled",
            broker.vpn[vpn].bridge[bridge].authScheme,
            broker.vpn[vpn].bridge[bridge].basicUser,
            remoteVpnSsl,
        ]);
    }
    if (tblDom.getElementsByTagName("tbody").length != 0) {
        addHeaderToDOM(`Bridges:`, 2, "vpns");
        addToBodyOrDom(createCopyTableButtonDom(tblDom), "vpns");
        addToBodyOrDom(tblDom, "vpns");
        await sleep(0);
    }
    
    // acl
    addEventTime("VPN ACL PROFILE", broker);
    addHeaderToDOM(`ACL Profiles:`, 2, "vpns");
    tblDom = document.createElement("table");
    overwriteTableHeaders(tblDom, ["ACL Profile", "Default Connect", "Connection Exception", "Default Publish", "Publish Exception", "Default Subscribe", "Subscribe Exception", "Mapped Clientusernames"]);
    for (acl in broker.vpn[vpn].aclProfile) {
        let defaultConnect = defaultPublish = defaultSubscribe = null;
        // add to acl summary table
        if (!allList.acl.includes(acl)) {
            allList.acl.push(acl);
            addRowToTable("aclSummaryTable", [acl, ...Array(allList.vpn.indexOf(vpn)).fill(""), "&check;"]);
        } else {
            updateTableCell("aclSummaryTable", allList.acl.indexOf(acl), allList.vpn.indexOf(vpn)+1, "&check;");
        }
        // add to acl individual tables
        connEx = broker.vpn[vpn].aclProfile[acl].clientConnectException.length;
        pubEx = broker.vpn[vpn].aclProfile[acl].publishTopicSmfException.length + 
        broker.vpn[vpn].aclProfile[acl].publishTopicMqttException.length;
        subEx = broker.vpn[vpn].aclProfile[acl].subscribeTopicSmfException.length + broker.vpn[vpn].aclProfile[acl].subscribeTopicMqttException.length;
        if (broker.vpn[vpn].aclProfile[acl].clientConnectDefaultAction == "allow" && connEx == 0) {
          defaultConnect = "<span class=\"warn\">allow</span>";
          problems.push(["LOW", "ACL Profile Default Connect", `ACL Profile ${acl} in Msg VPN ${vpn} allows all clients to connect.`]);
        } else
          defaultConnect = broker.vpn[vpn].aclProfile[acl].clientConnectDefaultAction;
        if (broker.vpn[vpn].aclProfile[acl].publishTopicDefaultAction == "allow" && pubEx == 0) {
          defaultPublish = "<span class=\"warn\">allow</span>";
          problems.push(["LOW", "ACL Profile Default Publish", `ACL Profile ${acl} in Msg VPN ${vpn} allows clients publish to all topics.`]);
        } else
          defaultPublish = broker.vpn[vpn].aclProfile[acl].publishTopicDefaultAction;
        if (broker.vpn[vpn].aclProfile[acl].subscribeTopicDefaultAction == "allow" && subEx == 0) {
          defaultSubscribe = "<span class=\"warn\">allow</span>";
          problems.push(["LOW", "ACL Profile Default Subscribe", `ACL Profile ${acl} in Msg VPN ${vpn} allows clients subscribe to all topics.`]);
        } else
          defaultSubscribe = broker.vpn[vpn].aclProfile[acl].subscribeTopicDefaultAction;
        if (broker.vpn[vpn].aclProfile[acl].mappedClientUsername.length > 0) {
          mappedUsername = broker.vpn[vpn].aclProfile[acl].mappedClientUsername.length;
        } else {
          mappedUsername = "<span class=\"warn\">0</span>";
          problems.push(["LOW", "ACL Profile Mapped Client Usernames", `ACL Profile ${acl} in Msg VPN ${vpn} has no mapped client usernames.`]);
        }
        addRowToTable(tblDom, [
          acl,
          defaultConnect,
          connEx,
          defaultPublish,
          pubEx,
          defaultSubscribe,
          subEx,
          mappedUsername,
        ]);
    }
    addToBodyOrDom(createCopyTableButtonDom(tblDom), "vpns");
    addToBodyOrDom(createTableBodyCountSpan(tblDom), "vpns");
    addToBodyOrDom(tblDom, "vpns");
    await sleep(0);
    
    // Client Profiles
    addEventTime("VPN CLIENT PROFILE", broker);
    addHeaderToDOM(`Client Profiles:`, 2, "vpns");
    tblDom = document.createElement("table");
    overwriteTableHeaders(tblDom, ["Client Profile", "Max Connections", "Max SMF Conn.", "Max Web Conn.", "Max Egress", "Max Ingress", "Max Transactions", "Max Message per Txn", "Mapped Clientusernames"]);
    for (cp in broker.vpn[vpn].clientProfile) {
        // add to cp summary table
        let maxConn = maxSmf = maxWeb = maxEg = maxIng = maxTxn = mappUser = null;
        if (!allList.cp.includes(cp)) {
            allList.cp.push(cp);
            addRowToTable("cpSummaryTable", [cp, ...Array(allList.vpn.indexOf(vpn)).fill(""), "&check;"]);
        } else {
            updateTableCell("cpSummaryTable", allList.cp.indexOf(cp), allList.vpn.indexOf(vpn)+1, "&check;");
        }
        if (broker.vpn[vpn].clientProfile[cp].perClientUsername.maxConnections >= 1000) {
            maxConn = "<span class=\"warn\">" + broker.vpn[vpn].clientProfile[cp].perClientUsername.maxConnections + "</span>";
            problems.push(["LOW", "Client Profile Max Connections", `Client Profile ${cp} in Msg VPN ${vpn} has default / excess number of connections.`]);
        } else
            maxConn = broker.vpn[vpn].clientProfile[cp].perClientUsername.maxConnections;
        if (broker.vpn[vpn].clientProfile[cp].perClientUsername.smfMaxConnections >= 1000) {
            maxSmf = "<span class=\"warn\">" + broker.vpn[vpn].clientProfile[cp].perClientUsername.smfMaxConnections + "</span>";
            problems.push(["LOW", "Client Profile Max SMF Connections", `Client Profile ${cp} in Msg VPN ${vpn} has default / excess number of SMF connections.`]);
        } else
            maxSmf = broker.vpn[vpn].clientProfile[cp].perClientUsername.smfMaxConnections;
        if (broker.vpn[vpn].clientProfile[cp].perClientUsername.webMaxConnections >= 1000) {
            maxWeb = "<span class=\"warn\">" + broker.vpn[vpn].clientProfile[cp].perClientUsername.webMaxConnections + "</span>";
            problems.push(["LOW", "Client Profile Max Web Connections", `Client Profile ${cp} in Msg VPN ${vpn} has default / excess number of Web connections.`]);
        } else
            maxWeb = broker.vpn[vpn].clientProfile[cp].perClientUsername.webMaxConnections;
        if (broker.vpn[vpn].clientProfile[cp].perClient.maxEgress >= 1000) {
            maxEg = "<span class=\"warn\">" + broker.vpn[vpn].clientProfile[cp].perClient.maxEgress + "</span>";
            problems.push(["LOW", "Client Profile Max Egress", `Client Profile ${cp} in Msg VPN ${vpn} has default / excess number of Egress flows per connection.`]);
        } else
            maxEg = broker.vpn[vpn].clientProfile[cp].perClient.maxEgress;
        if (broker.vpn[vpn].clientProfile[cp].perClient.maxIngress >= 1000) {
            maxIng = "<span class=\"warn\">" + broker.vpn[vpn].clientProfile[cp].perClient.maxIngress + "</span>";
            problems.push(["LOW", "Client Profile Max Ingress", `Client Profile ${cp} in Msg VPN ${vpn} has default / excess number of Ingress flows per connection.`]);
        } else
            maxIng = broker.vpn[vpn].clientProfile[cp].perClient.maxIngress
        if (broker.vpn[vpn].clientProfile[cp].perClient.maxTransactions >= 5000) {
            maxTxn = "<span class=\"warn\">" + broker.vpn[vpn].clientProfile[cp].perClient.maxTransactions + "</span>";
            problems.push(["LOW", "Client Profile Max Transactions", `Client Profile ${cp} in Msg VPN ${vpn} has default / excess number of allow transactions per connection.`]);
        } else
            maxTxn = broker.vpn[vpn].clientProfile[cp].perClient.maxTransactions;
        if (broker.vpn[vpn].clientProfile[cp].mappedClientUsername.length == 0) {
            mappUsr = "<span class=\"warn\">" + broker.vpn[vpn].clientProfile[cp].mappedClientUsername.length + "</span>";
            problems.push(["LOW", "Client Profile Mapped Client Usernames", `Client Profile ${cp} in Msg VPN ${vpn} has no mapped client usernames.`]);
        } else
            mappUsr = broker.vpn[vpn].clientProfile[cp].mappedClientUsername.length;
        // add to cp individual tables
        addRowToTable(tblDom, [
            cp,
            maxConn,
            maxSmf,
            maxWeb,
            maxEg,
            maxIng,
            maxTxn,
            broker.vpn[vpn].clientProfile[cp].perClient.maxMsgTransaction,
            mappUsr,
        ]);
    }
    addToBodyOrDom(createCopyTableButtonDom(tblDom), "vpns");
    addToBodyOrDom(createTableBodyCountSpan(tblDom), "vpns");
    addToBodyOrDom(tblDom, "vpns");
    await sleep(0);

    // Client Username
    addEventTime("VPN CLIENT USERNAME", broker);
    addHeaderToDOM(`Client Usernames:`, 2, "vpns");
    tblDom = document.createElement("table");
    tblDom.id = crypto.randomUUID();
    overwriteTableHeaders(tblDom, ["Client Username", "State", "ACL Profile", "Client Profile"]);
    addToBodyOrDom(createCopyTableButtonDom(tblDom), "vpns");
    addToBodyOrDom(createPopulateTableButtonDom(tblDom, broker.vpn[vpn]), "vpns");
    addToBodyOrDom(createTableBodyCountSpan(tblDom), "vpns");
    addToBodyOrDom(tblDom, "vpns");
    await sleep(0);
    
    // queues
    addEventTime("VPN QUEUES", broker);
    tblDom = document.createElement("table");
    overwriteTableHeaders(tblDom, ["Queue", "Owner", "Permissions", "Egress", "Ingress", "Access Type", "Max Spool", "Max Bind"]);
    subDom = document.createElement("table");
    overwriteTableHeaders(subDom, ["Queue", "Topic Subscription", "Comments"]);
    for (queue in broker.vpn[vpn].queue) {
      let subTop = [], subTopComm = [], owner = pems = maxSpool = maxBind = null;
      // add to queue individual tables
      for (let i in broker.vpn[vpn].queue[queue].subscriptionTopic) {
          let err = checkTopicString(broker.vpn[vpn].queue[queue].subscriptionTopic[i]);
          if (err != null) {
              for (e of err) {
                  problems.push(["MEDIUM", "Queue Subscription", `Msg VPN ${vpn}'s Queue ${queue}'s topic subscription. ${e}.`]);
                  subTopComm.push(e);
              }
              subTop.push(`<span class="warn">${broker.vpn[vpn].queue[queue].subscriptionTopic[i]}</span>`);
          }
      }
      if (broker.vpn[vpn].queue[queue].owner == "(none)") {
          owner = `<span class="error">(none)</span>`;
          problems.push(["HIGH", "Queue Owner", `Msg VPN ${vpn}'s Queue ${queue} has no owner.`]);
      } else
          owner = broker.vpn[vpn].queue[queue].owner;
      if (broker.vpn[vpn].queue[queue].permissionLevel > 1) {
          pems = `<span class="error">${broker.vpn[vpn].queue[queue].permission}</span>`;
          problems.push(["HIGH", "Queue Permissions", `Msg VPN ${vpn}'s Queue ${queue} allows non-owner consumption and/or modify permissions.`]);
      } else if (broker.vpn[vpn].queue[queue].permissionLevel == 1) {
          pems = `<span class="warn">${broker.vpn[vpn].queue[queue].permission}</span>`;
          problems.push(["LOW", "Queue Permissions", `Msg VPN ${vpn}'s Queue ${queue} allows non-owner read permissions.`]);
      } else
          pems = broker.vpn[vpn].queue[queue].permission;
      if (broker.vpn[vpn].queue[queue].maxSpoolUsage == 5000) {
          maxSpool = `<span class="warn">${broker.vpn[vpn].queue[queue].maxSpoolUsage}</span>`;
          problems.push(["LOW", "Queue Max Spool", `Msg VPN ${vpn}'s Queue ${queue} Max Spool Usage has default values.`]);
      } else
          maxSpool = broker.vpn[vpn].queue[queue].maxSpoolUsage;
      if (broker.vpn[vpn].queue[queue].maxBind == 1000) {
          maxBind = `<span class="warn">${broker.vpn[vpn].queue[queue].maxBind}</span>`;
          problems.push(["LOW", "Queue Bind Count", `Msg VPN ${vpn}'s Queue ${queue} Max Bind Count has default values.`]);
      } else
          maxBind = broker.vpn[vpn].queue[queue].maxBind;
      addRowToTable(tblDom, [
          queue,
          owner,
          pems,
          (broker.vpn[vpn].queue[queue].egressEnabled) ? "Enabled" : "Disabled",
          (broker.vpn[vpn].queue[queue].ingressEnabled) ? "Enabled" : "Disabled",
          broker.vpn[vpn].queue[queue].accessType,
          maxSpool,
          maxBind,
      ]);
      if (subTop.length > 0) 
          addRowToTable(subDom, [
              queue,
              subTop.join("<br>"),
              subTopComm.join("<br>"),
          ]);
    }
    if (tblDom.getElementsByTagName("tbody").length != 0) {
        addHeaderToDOM(`Queues:`, 2, "vpns");
        addToBodyOrDom(createCopyTableButtonDom(tblDom), "vpns");
        addToBodyOrDom(createTableBodyCountSpan(tblDom), "vpns");
        addToBodyOrDom(tblDom, "vpns");
        await sleep(0);
    }
    if (subDom.getElementsByTagName("tbody").length != 0) {
        addHeaderToDOM(`Queue subscription issues:`, 3, "vpns");
        addToBodyOrDom(createCopyTableButtonDom(subDom), "vpns");
        addToBodyOrDom(createTableBodyCountSpan(tblDom), "vpns");
        addToBodyOrDom(subDom, "vpns");
        await sleep(0);
    }
    
    // topic endpoint
    addEventTime("VPN TOPIC ENDPOINTS", broker);
    tblDom = document.createElement("table");
    overwriteTableHeaders(tblDom, ["Topic Name", "Topic Subscribed", "Owner", "Permissions", "Egress", "Ingress", "Access Type", "Max Spool", "Max Bind"]);
    for (topic in broker.vpn[vpn].topicEndpoint) {
      let owner = pems = maxSpool = maxBind = null;
      if (broker.vpn[vpn].queue[queue].owner == "(none)") {
          owner = `<span class="error">(none)</span>`;
          problems.push(["HIGH", "Topic Endpoint Owner", `Msg VPN ${vpn}'s Topic Endpoint ${topic} has no owner.`]);
      } else
          owner = broker.vpn[vpn].topicEndpoint[topic].owner;
      if (broker.vpn[vpn].topicEndpoint[topic].permissionLevel > 1) {
          pems = `<span class="error">${broker.vpn[vpn].topicEndpoint[topic].permission}</span>`;
          problems.push(["HIGH", "Topic Endpoint Permissions", `Msg VPN ${vpn}'s Topic Endpoint ${topic} allows non-owner consumption and/or modify permissions.`]);
      } else if (broker.vpn[vpn].topicEndpoint[topic].permissionLevel == 1) {
          pems = `<span class="warn">${broker.vpn[vpn].topicEndpoint[topic].permission}</span>`;
          problems.push(["LOW", "Topic Endpoint Permissions", `Msg VPN ${vpn}'s Topic Endpoint ${topic} allows non-owner read permissions.`]);
      } else
          pems = broker.vpn[vpn].topicEndpoint[topic].permission;
      if (broker.vpn[vpn].topicEndpoint[topic].maxSpoolUsage == 5000) {
          maxSpool = `<span class="warn">${broker.vpn[vpn].topicEndpoint[topic].maxSpoolUsage}</span>`;
          problems.push(["LOW", "Topic Endpoint Max Spool", `Msg VPN ${vpn}'s Topic Endpoint ${topic} Max Spool Usage has default values.`]);
      } else
          maxSpool = broker.vpn[vpn].topicEndpoint[topic].maxSpoolUsage;
      if (broker.vpn[vpn].topicEndpoint[topic].maxBind == 1000) {
          maxBind = `<span class="warn">${broker.vpn[vpn].topicEndpoint[topic].maxBind}</span>`;
          problems.push(["LOW", "Topic Endpoint Max Bind Count", `Msg VPN ${vpn}'s Topic Endpoint ${topic} Max Bind Count has default values.`]);
      } else
          maxBind = broker.vpn[vpn].topicEndpoint[topic].maxBind;
      addRowToTable(tblDom, [
          topic,
          broker.vpn[vpn].topicEndpoint[topic].topic,
          owner,
          pems,
          (broker.vpn[vpn].topicEndpoint[topic].egressEnabled) ? "Enabled" : "Disabled",
          (broker.vpn[vpn].topicEndpoint[topic].ingressEnabled) ? "Enabled" : "Disabled",
          broker.vpn[vpn].topicEndpoint[topic].accessType,
          maxSpool,
          maxBind,
      ]);
    }
    if (tblDom.getElementsByTagName("tbody").length != 0) {
        addHeaderToDOM(`Topic Endpoints:`, 2, "vpns");
        addToBodyOrDom(createCopyTableButtonDom(tblDom), "vpns");
        addToBodyOrDom(createTableBodyCountSpan(tblDom), "vpns");
        addToBodyOrDom(tblDom, "vpns");
        await sleep(0);
    }
    addEventTime(`${vpn} VPN END`, broker);
  }
  
  fillTableTd("aclSummaryTable");
  fillTableTd("cpSummaryTable");
  fillTableTd("cuSummaryTable");

  addEventTime("PROBLEMS", broker);
  overwriteTableHeaders("problemListTable", ["Severity", "Area", "Description"]);
  //for (problem of problems) {
  //  addRowToTable("problemListTable", problem);
  //}
  document.getElementById("hostnamePanel").textContent = "Loaded !";
  setTimeout(() => { document.getElementById("hostnamePanel").textContent = broker.hostname; }, 5000);
}
async function parseClientJsonAndDisplay(client) {
  //client detail list
  addHeaderToDOM("Clients", 1, "mainPanel");
  tblDom = document.createElement("table");
  overwriteTableHeaders(tblDom, ["VPN", "Client Username", "API", "Version", "IP", "Detail"]);
  for (api of Object.keys(client)) {
    for (ver of Object.keys(client[api])) {
      for (vpn of Object.keys(client[api][ver])) {
        for (user of Object.keys(client[api][ver][vpn])) {
          for (ip of Object.keys(client[api][ver][vpn][user])) {
            addRowToTable(tblDom, [vpn, user, api, ver, ip, client[api][ver][vpn][user][ip].join("<br/>")]);
          }
        }
      }
    }
  }
  addToBodyOrDom(createCopyTableButtonDom(tblDom), "mainPanel");
  addToBodyOrDom(tblDom, "mainPanel");
  await sleep(0);
}