let brokerData = clientData = null;
let files = {clientDetailData: null, configCliData: null, gatherDiagData: null };

// URL PARAMETERS
let urlParameters = new URLSearchParams(document.location.search);
let ignoreHostnameMatch = (urlParameters.get("urlParameters"));

///////////////////////////////
// REPORT RELATED OPERATIONS //
///////////////////////////////
// <SEVERITY>: <AREA> : [<ISSUE DESCRIPTION>, <RECOMMENDED NEXT STEPS>]
const issueSummaryArray = { 
  HIGH: {
    'Power Module':                         ["Broker's power module(s) are not fully operational.", 'Investigate if power modules are operational or need to be replaced.'],
    'Broker Replication':                   ['Broker(s) do not have data replication configured.', 'Configure and enable data replication.'],
    'VPN Authentication':                   ['${count} VPN(s) do not have authentication enabled.', 'Enable VPN authentication to prevent unauthorized access.'],
    'VPN Replication':                      ['${count} VPN(s) do not have data replication configured.', 'Configure and enable VPN data replication.'],
    'Queue Permissions':                    ['${count} queue(s) allow non-owner consumption/modification.', 'Reduce non-owner queue permissions to prevent unauthorized consumption of messages or modification of queue.'],
    'Queue Owner':                          ['${count} queue(s) do not have owners configured.', 'Define queue owner to ensure clear ownership.'],
    'Sol OS Version':                       ['Solace OS version is out of support.', 'Get in contact with your Solace consultant team immediately to plan for an upgrade.'],
    'Topic Endpoint Permissions':           ['${count} topic endpoint(s) allow non-owner consumption/modification.', 'Reduce non-owner topic endpoint permissions to prevent unauthorized consumption of messages or modification of topic endpoint.'],
    'Topic Endpoint Owner':                 ['${count} topic endpoint(s) do not have owners configured.', 'Define queue owner to ensure clear topic endpoint ownership.'],
    'VRF Management':                       ['VRF Management interface is not configured/enabled', 'Configure and enable VRF Management interface'],
    'VRF Message Backbone':                 ['VRF Message Backbone interface is not configured/enabled', 'Configure and enable VRF Message Backbone interface'],
    'Server Certificate Validity Period':   ['Service certificate is not within valid time period.', 'Reissue server certificate with valid time period immediately.'],
  },
  MEDIUM: {
    'Sol OS Version':                       ['Solace OS will be out of support within 1 year.', 'Please start planning for an SolOS upgrade/refresh.'],
    'Queue Subscription':                   ['${count} queue(s) have improper topic subscription configured.', 'Fix topic subscription strings.'],
    'Server Certificate Validity Period':   ['Service certificate is nearing expiry.', 'Plan to reissue new server certificate soon.'],
  },
  LOW: {
    'Config Sync SSL':                        ['Broker(s) config-sync is not SSL-enabled.', 'Enable SSL connection on config sync.'],
    'Broker Replication SSL':                 ['Broker Replication is not SSL-enabled', 'Enable SSL connection for Broker Replication.'],
    'Server Certificate Validity Period':     ['Service certificate is expiring within a year.', 'Plan to reissue server certificate.'],
    'VPN Max Connections':                    ['${count} VPN(s) has Max Connections less than sum of all Client Usernames' + "' Client Profile Max Connection.", 'Review configuration value and assign appropriate value based on actual requirements.'],
    'VPN Max Spool Usage':                    ['${count} VPN(s) are using default Max Egress setting', 'Review configuration value and assign appropriate value based on actual requirements.'],
    'VPN Max Egress':                         ['${count} VPN(s) are using default Max Egress setting', 'Review configuration value and assign appropriate value based on actual requirements.'],
    'VPN Max Ingress':                        ['${count} VPN(s) are using default Max Ingress setting', 'Review configuration value and assign appropriate value based on actual requirements.'],
    'VPN Bridge SSL':                         ['${count} VPN Bridge(s) is/are not SSL-enabled.', 'Enable SSL connection on VPN bridge(s)'],
    'ACL Profile Default Connect':            ['${count} ACL Profile(s) allow all clients to connect.', 'Consider using a whitelist approach to reduce risk of unauthorized clients.'],
    'ACL Profile Default Publish':            ['${count} ACL Profile(s) allow clients publish to all topics.','Review and assign appropriate topic exception based on defined topic taxonomy to prevent unauthorized accidental message publication.'],
    'ACL Profile Default Subscribe':          ['${count} ACL Profile(s) allow clients subscribe to all topics.', 'Review and assign appropriate topic exception based on defined topic taxonomy to prevent unauthorized accidental message subscription.'],
    'ACL Profile Mapped Client Usernames':    ['${count} ACL Profile(s) has/have no mapped client usernames.', 'Consider removing unmapped ACL profile(s).'],
    'Client Profile Max Connections':         ['${count} Client Profile(s) has/have default / excess number of connections.',     'Review configuration value and assign appropriate values based on actual requirements and VPN configured limits.'],
    'Client Profile Max SMF Connections':     ['${count} Client Profile(s) has/have default / excess number of SMF connections.', 'Review configuration value and assign appropriate values based on actual requirements and VPN configured limits.'],
    'Client Profile Max Web Connections':     ['${count} Client Profile(s) has/have default / excess number of WEB connections.', 'Review configuration value and assign appropriate values based on actual requirements and VPN configured limits.'],
    'Client Profile Max Egress':              ['${count} Client Profile(s) has/have default / excess number of egress flows per connection.', 'Review configuration value and assign appropriate values based on actual requirements and VPN configured limits.'],
    'Client Profile Max Ingress':             ['${count} Client Profile(s) has/have default / excess number of ingress flows per connection.', 'Review configuration value and assign appropriate values based on actual requirements and VPN configured limits.'],
    'Client Profile Max Transactions':        ['${count} Client Profile(s) has/have default / excess number of allowed transactions per connection.', 'Review configuration value and assign appropriate values based on actual requirements and VPN configured limits.'],
    'Client Profile Mapped Client Usernames': ['${count} Client Profile(s) has/have no mapped client usernames.', 'Consider removing unmapped client profile(s).'],
    'Queue Max Spool':                        ['${count} queue(s) have default max spool configured.',          "Review configuration value and assign appropriate values based on actual requirements, other queues' and topics' configuration, and VPN configured limits."],
    'Queue Bind Count':                       ['${count} queue(s) have default max bind configured.',           "Review configuration value and assign appropriate values based on actual requirements, other queues' and topics' configuration, and VPN configured limits."],
    'Queue Permissions':                      ['${count} queue(s) allow non-owner read permissions.', "Review requirements and adjust queue permissions to 'no-access' if applicable."],
    'Topic Endpoint Max Spool':               ['${count} topic endpoint(s) have default max spool configured.', "Review configuration value and assign appropriate values based on actual requirements, other queues' and topics' configuration, and VPN configured limits."],
    'Topic Endpoint Bind Count':              ['${count} topic endpoint(s) have default max bind configured.',  "Review configuration value and assign appropriate values based on actual requirements, other queues' and topics' configuration, and VPN configured limits."],
    'Topic Endpoint Permissions':             ['${count} topic endpoint(s) allow non-owner read permissions.', "Review requirements and adjust topic endpoint permissions to 'no-access' if applicable."],
  }
};
function issueSummaryDesc(sev, cat, count) {
  if (hasProperty(issueSummaryArray, `${sev}.${cat}`))
    return issueSummaryArray[sev][cat][0].replace('${count}', count);
  return `(${sev} : ${cat}) Issue Description not defined`;
}
function issueSummaryReco(sev, cat, count) {
  if (hasProperty(issueSummaryArray, `${sev}.${cat}`))
    return issueSummaryArray[sev][cat][1];
  return `(${sev} : ${cat}) Issue Resolution not defined`;
}

///////////////////////
// STRING OPERATIONS //
///////////////////////
function capitalizeWord(text) {
  if (text.length == 0)
    return "";
  else
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
}

function enabledOrDisabled(obj, path, trueVal = "Enabled", falseVal = "Disabled") {
  if (!obj || typeof obj !== 'object') return "(undefined)";

  const keys = Array.isArray(path) ? path : path.split('.');

  for (let key of keys) {
    if (!(key in obj)) return "(undefined)";
    obj = obj[key];
  }

  if (obj)
    return trueVal;
  return falseVal;
}

function escapeHTML(text) {
  textDom = document.createElement("div");
  textDom.textContent = text;
  escaped = textDom.innerHTML;
  textDom.remove();
  return escaped;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Text copied to clipboard successfully!');
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
    });
}

function jsonCopy() {
  let jsonString = JSON.stringify(brokerData);
  copyToClipboard(jsonString.replace(/\\/g, '\\\\'));
}
let lastUuid = lastParent = null;
///////////////////////
// FRONT-END RELATED //
///////////////////////
function addEmptyLastHeaderAnchor() {
  anc = document.createElement("a");
  anc.name = lastUuid, anc.textContent = (" ");
  addToBodyOrDom(anc, lastParent);
}
function addHeaderToDOM(text, level = 3, parent = "mainPanel") {
  uuid = crypto.randomUUID();
  lastParent = parent, lastUuid = uuid, anc = document.createElement("a");
  anc.name = uuid;
  header = document.createElement("h" + level);
  header.textContent = text;
  anc.appendChild(header);
  addToBodyOrDom(anc, parent);
  naviText = ".".repeat(level-1) + text.replace(":","").replace("Message VPN ", "VPN: ");
  let lk = document.createElement("li");
  if (level > 1)
    lk.classList.add("not-bold", "left-margin-10");
  lk.innerHTML = `<a href="#${uuid}">${naviText}</a>`;
  addToBodyOrDom(lk, 'naviMenu');
}

function addRowToTable(idOrDom, cellArr) {
  bodyDom = returnTableBodyDom(idOrDom);
  row = document.createElement("tr");
  for (cell of cellArr) {
    tcell = document.createElement("td");
    tcell.innerHTML = cell;
    row.appendChild(tcell);
  }
  bodyDom.appendChild(row);
  rowCountId = bodyDom.parentElement.id + "Rows"
  if (document.getElementById(rowCountId) != null)
    document.getElementById(rowCountId).textContent = bodyDom.children.length + " rows";
}

function addToBodyOrDom(element, parent = "mainPanel") {
  if (parent == "body")
    setTimeout( () => { document.body.appendChild(element); }, 10);
  else
    setTimeout( () => { document.getElementById(parent).appendChild(element); }, 10);
}

function copyTable(table) {
  let rng = document.createRange();
  rng.selectNode(table)
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(rng);
  document.execCommand("copy");
  sel.removeAllRanges();
}

function copyTableBody(table) {
  if (table.tagName.toLowerCase() == "table")
    tableBody = table.getElementsByTagName("tbody");
  if (tableBody == null)
    tableBody = table;
  else
    tableBody = tableBody[0];
  let rng = document.createRange();
  rng.selectNode(tableBody)
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(rng);
  document.execCommand("copy");
  sel.removeAllRanges();
}

function createTableBodyCountSpan(idOrDom) {
  bodyDom = returnTableBodyDom(idOrDom);
  tableDom = returnParentTableDom(bodyDom);
  let span = document.createElement("span");
  span.id = tableDom.id + "Rows";
  span.classList.add("row-count");
  span.textContent = bodyDom.children.length + " rows";
  return span;
}

function createCopyTableButtonDom(table) {
  let dom = document.createElement("button");
  dom.textContent = "Copy Table";
  dom.onclick = () => {
    let rng = document.createRange();
    rng.selectNode(table)
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rng);
    document.execCommand("copy");
    sel.removeAllRanges();
  };
  return dom;
}

function createPopulateTableButtonDom(table, vpn, clickFunc) {
  let dom = document.createElement("button");
  dom.textContent = "Populate Table";
  dom.onclick = () => {
    clickFunc(table, vpn);
  };
  return dom;
}

function fillTableTd(tableOrDom) {
  tableDom = (typeof tableOrDom === 'string') ? document.getElementById(tableOrDom) : tableOrDom;
  if (tableDom.children.length > 0 && tableDom.children[0].children.length > 0) {
    rows = tableDom.querySelectorAll("tr");
    cols = tableDom.children[0].children.length;
    for (row of rows) {
      while (row.children.length < cols)
        row.appendChild(document.createElement("td"));
    }
  }
}

function initializeMainPanel() {
  document.getElementById("mainPanel").innerHTML = `
    <div style="height:70px"></div>
    <a name="issues"><h1>Issues</h1></a>
    <div id="problems" class="scrolling">
      <button onclick="copyTable(document.getElementById('problemListTable'))">Copy Table</button>
      <button onclick="populateProblemTable('problemListTable')">Populate Table</button>
      <span class="row-count" id="problemListTableRows"></span>
      <table class="summary" id="problemListTable">
        <thead class="sticky"></thead>
      </table>
    </div>
    <a name="issueSummary"><h2>Issue Summary Count</h2></a>
    <button onclick="copyTable(document.getElementById('problemListTableSummary'))">Copy Table</button>
    <span class="row-count" id="problemListTableSummaryRows"></span>
    <table class="summary" id="problemListTableSummary"></table>
    
    <a name="issueDesc"><h2>Issue Summary Description</h2></a>
    <button onclick="copyTable(document.getElementById('problemListTableSummaryDesc'))">Copy Table</button>
    <span class="row-count" id="problemListTableSummaryDescRows"></span>
    <table class="summary" id="problemListTableSummaryDesc"></table>

    <a name="issueReco"><h2>Issue Summary Recommendation</h2></a>
    <button onclick="copyTable(document.getElementById('problemListTableSummaryReco'))">Copy Table</button>
    <span class="row-count" id="problemListTableSummaryRecoRows"></span>
    <table class="summary" id="problemListTableSummaryReco"></table>

    
    <div id="brokerSummary">
      <a name="brokerSummary">
        <h1>Broker Summary</h1>
      </a>
      <button onclick="copyTableBody(document.getElementById('brokerSummaryTableGen'))">Copy Table Body</button>
      <table class="summary" id="brokerSummaryTableGen"></table>

      <button onclick="copyTableBody(document.getElementById('brokerSummaryTableHw'))">Copy Table Body</button>
      <table class="summary" id="brokerSummaryTableHw"></table>

      <button onclick="copyTableBody(document.getElementById('brokerSummaryTableIntf'))">Copy Table Body</button>
      <table class="summary" id="brokerSummaryTableIntf"></table>

      <button onclick="copyTableBody(document.getElementById('brokerSummaryTableLag'))">Copy Table Body</button>
      <table class="summary" id="brokerSummaryTableLag"></table>

      <button onclick="copyTableBody(document.getElementById('brokerSummaryTableRdcy'))">Copy Table Body</button>
      <table class="summary" id="brokerSummaryTableRdcy"></table>

      <button onclick="copyTableBody(document.getElementById('brokerSummaryTableRep'))">Copy Table Body</button>
      <table class="summary" id="brokerSummaryTableRep"></table>
      
      <button onclick="copyTableBody(document.getElementById('brokerSummaryTableCert'))">Copy Table Body</button>
      <table class="summary" id="brokerSummaryTableCert"></table>
      
      
    </div>
    <div id="vpnSummary">
      <a name="vpnSummary"><h1>VPN Summary</h1></a>
      
      <a name="vpnGeneral"><h2>General</h2></a>
      <button onclick="copyTable(document.getElementById('vpnSummaryTable'))">Copy Table</button>
      <table class="summary" id="vpnSummaryTable"></table>
      
      <a name="vpnReplication"><h2>Replication</h2></a>
      <button onclick="copyTable(document.getElementById('vpnSummaryReplTable'))">Copy Table</button>
      <table class="summary" id="vpnSummaryReplTable"></table>
      
      <a name="vpnServices"><h2>VPN Services</h2></a>
      <button onclick="copyTable(document.getElementById('vpnServicesTable'))">Copy Table</button>
      <table class="summary" id="vpnServicesTable"></table>
      <button onclick="copyTable(document.getElementById('vpnServices2Table'))">Copy Table</button>
      <table class="summary" id="vpnServices2Table"></table>
      
      <a name="vpnCountSummary"><h2>Count Summary</h2></a>
      <button onclick="copyTable(document.getElementById('vpnCountSummaryTable'))">Copy Table</button>
      <table class="summary" id="vpnCountSummaryTable"></table>
      
      <a name="vpnLimits"><h2>VPN Limits</h2></a>
      <button onclick="copyTable(document.getElementById('vpnSummaryLimitsTable'))">Copy Table</button>
      <table class="summary" id="vpnSummaryLimitsTable"></table>
    </div>
    <div id="aclSummary">
      <a name="vpnACLSummary"><h2>ACL Profile Summary</h2></a>
      <span class="row-count" id="aclSummaryTableRows"></span>
      <table class="summary" id="aclSummaryTable"></table>
    </div>
    
    <div id="cpSummary">
      <a name="vpnCPSummary"><h2>Client Profile Summary</h2></a>
      <span class="row-count" id="cpSummaryTableRows"></span>
      <table class="summary" id="cpSummaryTable"></table>
    </div>
    
    <div id="cuSummary">
      <a name="vpnCUSummary"><h2>Client Username Summary</h2></a>
      <span class="row-count" id="cuSummaryTableRows"></span>
      <table class="summary" id="cuSummaryTable"></table>
    </div>
    
    <div id="vpns"></div>`;
}

function overwriteTableHeaders(idOrDom, cellArr) {
  tableDom = (typeof idOrDom === 'string') ? document.getElementById(idOrDom) : idOrDom;
  if (tableDom.tagName.toUpperCase() == "TABLE") {
    headerDom = tableDom.getElementsByTagName("thead");
    if (headerDom.length == 0) {
      headerDom = document.createElement("thead");
      tableDom.appendChild(headerDom);
    } else {
      headerDom = headerDom[0]
      headerDom.innerHTML = "";
    }
  } else if (tableDom.tagName.toUpperCase() == "THEAD") {
    headerDom = tableDom;
  } else {
    throw "idOrDom must be the TABLE/THEAD Element Id or the Element";
  }
  for (cell of cellArr) {
    tcell = document.createElement("th");
    tcell.textContent = cell;
    headerDom.appendChild(tcell);
  }
}

function populateClientUsernameTable(domOrId, vpn) {
  overwriteTableHeaders(domOrId, ["Client Username", "State", "ACL Profile", "Client Profile"]);
  returnTableBodyDom(domOrId).innerHTML = "";
  for (cu in vpn.clientUsername) {
      // add to cu summary table
      if (!allList.cu.includes(cu)) {
          allList.cu.push(cu);
          addRowToTable("cuSummaryTable", [cu, ...Array(allList.vpn.indexOf(vpn.name)).fill(""), "&check;"]);
      } else {
          updateTableCell("cuSummaryTable", allList.cu.indexOf(cu), allList.vpn.indexOf(vpn.name)+1, "&check;");
      }
      // add to cu individual tables
      addRowToTable(domOrId, [
          cu,
          (vpn.clientUsername[cu].enabled) ? "Enabled" : "Disabled",
          vpn.clientUsername[cu].aclProfile,
          vpn.clientUsername[cu].clientProfile,
      ]);
  }
  fillTableTd("cuSummaryTable");
}

async function populateProblemTable(domId) {
  returnTableBodyDom(domId).innerHTML = "";
  overwriteTableHeaders(domId, ["Severity", "Area", "Description"]);
  summary = {};
  for (problem of problems) {
    addRowToTable(domId, problem);
    if (typeof summary[problem[0]] === 'undefined')
      summary[problem[0]] = {};
    if (typeof summary[problem[0]][problem[1]] === 'undefined')
      summary[problem[0]][problem[1]] = 1;
    else
      summary[problem[0]][problem[1]]++;
    if (Math.floor(Math.random() * 100) == 0)
      await sleep(0);
  }
  for (sev in summary) {
    for (cat in summary[sev]) {
      addRowToTable(domId + "Summary", [sev, cat, summary[sev][cat]]);
      addRowToTable(domId + "SummaryDesc", [sev, cat, issueSummaryDesc(sev, cat, summary[sev][cat])]);
      addRowToTable(domId + "SummaryReco", [sev, cat, issueSummaryReco(sev, cat, summary[sev][cat])]);
    }
  }
  document.getElementById("problemListTableRows").textContent += " - done";
}

function populateQueueTopicSubscriptionTable(domOrId, vpn) {
  overwriteTableHeaders(domOrId, ["Queue", "Topic Subscription"]);
  returnTableBodyDom(domOrId).innerHTML = "";
  for (queue in vpn.queue) {
    for (i in vpn.queue[queue].subscriptionTopic) {
      addRowToTable(domOrId, [queue, vpn.queue[queue].subscriptionTopic[i]]);
    }
  }
}
function returnParentTableDom(idOrDom) {
  let bodyDom = (typeof idOrDom === 'string') ? document.getElementById(idOrDom) : idOrDom;
  if (bodyDom.tagName.toUpperCase() == "TABLE") {
    return bodyDom;
  } else if (bodyDom.tagName.toUpperCase() == "TBODY") {
    while (bodyDom.tagName.toUpperCase() != "TABLE")
      bodyDom = bodyDom.parentElement;
    return bodyDom;
  } else {
    throw "Element is not a TABLE/TBODY.";
  }
  return null;
}

function returnTableBodyDom(idOrDom, createBody = true) {
  let tableDom = (typeof idOrDom === 'string') ? document.getElementById(idOrDom) : idOrDom;
  let bodyDom = null;
  if (tableDom.tagName.toUpperCase() == "TABLE") {
    bodyDom = tableDom.getElementsByTagName("tbody");
    if (bodyDom.length > 0) {
      bodyDom = bodyDom[0];
    } else if (createBody) {
      bodyDom = document.createElement("tbody");
      tableDom.appendChild(bodyDom);
    } else {
      throw "Table Body Element not found.";
    }
  } else if (tableDom.tagName.toUpperCase() == "TBODY") {
    bodyDom = tableDom;
  } else {
    throw "Element is not a TABLE/TBODY.";
  }
  return bodyDom;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateStatus(line, total, domId) {
  await sleep(0);
  line = parseInt(line) + 1;
  pct = Math.round(line / total * 100);
  document.getElementById(domId).innerHTML = `Processed ${pct}%`;
  document.getElementById(domId).offsetWidth;
  await sleep(0);
}

function updateTableCell(idOrDom, row, col, text, overwrite = true) {
  bodyDom = returnTableBodyDom(idOrDom, false);
  rowDom = bodyDom.children[row];
  
  while (rowDom.children.length <= col) {
    rowDom.appendChild(document.createElement("td"));
  }
  rowDom.children[col].innerHTML = text;
}
///////////////////
// FILES PREVIEW //
///////////////////
async function prepFile(fileInput, varName) {
  if (fileInput.files.length > 0) {
    fileData = await fileInput.files[0].text();
    files[varName] = fileData.split(/\r?\n/);
    targetDom = document.getElementById(fileInput.getAttribute("lineTarget"));
    targetDom.textContent = `${files[varName].length} lines`
  } else {
    targetDom = document.getElementById(fileInput.getAttribute("lineTarget"));
    targetDom.textContent = "";
  }
}
async function processFiles() {
  let broker = {
    alarms: "something", 
    backup: {},
    configSync: {},
    defrag: { schedule: {}, threshold: {} },
    domainCertAuthority: [],
    dns: { ns: [] },
    hardware: { cpu: [], adb: { blade: [], }, hba: { blade: [], },  nab: { blade: [], }, lun: {}, },
    intf: { vrfMgmt:{}, vrfMgmtEnabled: false, vrfMsg: {}, vrfMsgEnabled: false, },
    ldap: {},
    mqtt: {},
    msgSpool: { utilization: {}, },
    ntp: { server: [], },
    power: { status: {}, },
    redundancy: {},
    replication: {},
    scaling: {}, 
    syslog: [],
    semp: { accessLevel: { default: {}, ldap: { group: {} } }, },
    ssl: {}, 
    svcs: { semp: {}, smf: {}, web: {}, rest: {}, mqtt: {}, amqp: {}, healthcheck: {}, },
    vpn: {},
    username: {},
    execTime: [],
    totalExecTime: 0,
  }
  let client = {};
  document.getElementById("gatherDiagLinesProcessed").innerHTML = "";
  document.getElementById("clientDetailLinesProcessed").innerHTML = "";
  document.getElementById("currentConfigLinesProcessed").innerHTML = "";
  
  broker.execStart = performance.now();
  if (document.getElementById("currentConfigFile").files.length > 0)
    broker = await processCLI(files.configCliData, broker);
  addEventTime("Parsed current-config cli", broker);
  if (document.getElementById("clientDetailFile").files.length > 0)
    client = await processClients(files.clientDetailData, client);
  addEventTime("Parsed Client Detail", broker);
  if (document.getElementById("gatherDiagFile").files.length > 0)
    broker = await processGD(files.gatherDiagData, broker);
  addEventTime("Parsed Gather Diagnostics", broker);
  brokerData = broker;
  clientData = client;
  addEventTime("BROKER START", broker);
  await parseBrokerJsonAndDisplay(broker);
  addEventTime("CLIENT LIST START", broker);
  await parseClientJsonAndDisplay(client);
  addEventTime("END", broker);
  addObserver();
}

///////////////
// CLI FUNCS //
///////////////
function checkCliExitBlock(lines, lineNum, spaces = 2) {
  return (lines[lineNum] != " ".repeat(spaces)+"exit" && lineNum < lines.length)
}

function checkTopicString(topic) {
  err = [];
  if (topic.includes(">") && !topic.endsWith(">"))
    err.push("Topic string containing '>' must end with '>'");
  if (/[\n\r\t]$/.test(topic))
    err.push("Topic string ending includes tab/newline non-alphanumeric character");
  if (topic == ">")
    err.push("Topic should not be 'catch-all' and should follow a well-defined taxonomy");
  if (/^\s+$/.test(topic))
    err.push("Topic only contains whitespaces");
  return (err.length == 0) ? null : err;
}

function cleanArr(text) {
  return (text.trim() == "") ? [] : text.match(/"[^"]*"|\S+/g).map(s => s.replace(/^"|"$/g, ''));
  //return text.replaceAll('"','').trim().split(/\s+/);
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const length = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < length; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function hasProperty(obj, path) {
  if (!obj || typeof obj !== 'object') return false;

  //const keys = Array.isArray(path) ? path : path.split('.');
  const keys = Array.isArray(path) ? path : path.split(/(?<!\\)\./).map(key => key.replace(/\\\./g, '.'));

  for (let key of keys) {
    if (!(key in obj)) return false;
    obj = obj[key];
  }

  return obj !== undefined;
}

function processGlobalDefaultAccess(lineNum, lines) {
  let level = 1, glob = def = null, accessEx = {};
  while (level != 0 && typeof lines[lineNum] !== 'undefined') {
    _TMP = cleanArr(lines[lineNum]);
    switch (_TMP[0]) {
      case "global-access-level":
        glob = _TMP[1];
        break;
      case "message-vpn":
        level++;
        break;
      case "default-access-level":
        def = _TMP[1];
        break;
      case "create":
        if (_TMP[1] == "access-level-exception") {
          vpnName = _TMP[2];
          level++;
        }
      case "access-level":
        accessEx[vpnName] = _TMP[1];
      case "exit":
        level--;
        break;
    }
    lineNum++;
  }
  return { 
    lineNum: --lineNum,
    obj: { globalAccess: glob, defaultAccess: def, accessException: accessEx, }
  };
}

/////////////////
// PERFORMANCE //
/////////////////

function addEventTime(text, broker) {
  prevTime = (broker.execTime.length > 0) ? broker.execTime[broker.execTime.length - 1].time : broker.execStart;
  nowTime = performance.now();
  duration = parseFloat((nowTime - prevTime).toFixed(3));
  broker.execTime.push({ event: text, time: nowTime, duration: duration});
  broker.totalExecTime += duration;
}

function addObserver() {
  const links = document.querySelectorAll("ul li a");
  const sections = Array.from(links).map(link => document.querySelector(`a[name="` + link.getAttribute("href").substr(1) + `"]`));

  const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(link => link.classList.remove("active-section"));
          if (entry.target.name.length > 0) {
            const activeLink = document.querySelector(`ul li a[href="#${entry.target.name}"]`);
            if (activeLink) activeLink.classList.add("active-section");
          }
        }
      });
    }, {
      root: null,
      rootMargin: "0px 0px -80% 0px", // Trigger earlier
      threshold: 0.1
    }
  );
  sections.forEach(section => {
    if (section) observer.observe(section);
  });
}