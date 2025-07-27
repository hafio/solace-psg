let brokerData = clientData = null;
let files = {clientDetailData: null, configCliData: null, gatherDiagData: null };
queuePermissionLevels = {
    0: "no-access",
    1: "read-only",
    2: "consume",
    3: "modify-topic",
    4: "delete",
    "no-access": 0,
    "read-only": 1,
    "consume": 2,
    "modify-topic": 3,
    "delete": 4,
};

///////////////////////
// STRING OPERATIONS //
///////////////////////
function capitalizeWord(text) {
  if (text.length == 0)
    return "";
  else
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
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

///////////////////////
// FRONT-END RELATED //
///////////////////////
function addHeaderToDOM(text, level = 3, parent = "mainPanel") {
    uuid = crypto.randomUUID();
    anc = document.createElement("a");
    anc.name = uuid
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
    tableDom = (typeof idOrDom === 'string') ? document.getElementById(idOrDom) : idOrDom;
    bodyDom = null;
    if (tableDom.tagName.toUpperCase() == "TABLE") {
        bodyDom = tableDom.getElementsByTagName("tbody");
        if (bodyDom.length == 0) {
            bodyDom = document.createElement("tbody");
            tableDom.appendChild(bodyDom);
        } else
            bodyDom = bodyDom[0];
        
    } else if (tableDom.tagName.toUpperCase() == "TBODY") {
        bodyDom = tableDom;
    } else {
        throw new Exception("idOrDom must be the TABLE/TBODY Element Id or the Element");
    }
    row = document.createElement("tr");
    for (cell of cellArr) {
      tcell = document.createElement("td");
      tcell.innerHTML = cell;
      row.appendChild(tcell);
    }
    bodyDom.appendChild(row);
}

function addToBodyOrDom(element, parent = "mainPanel") {
    if (parent == "body")
        document.body.appendChild(element);
    else
        document.getElementById(parent).appendChild(element);
}

function clearAllTables() {
  tbls =  document.getElementsByTagName("table");
  for (let i=0; i<tbls.length;i++)
    tbls[i].innerHTML = "";
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
      <a name="issues"><h1>Issues</h1></a>
      <div id="problems" class="scrolling">
        <button onclick="copyTable(document.getElementById('problemListTable'))">Copy Table</button>
        <table class="summary" id="problemListTable">
          <thead class="sticky"></thead>
        </table>
      </div>
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
      </div>
      <div id="vpnSummary">
        <a name="vpnSummary"><h1>VPN Summary</h1></a>
        
        <a name="vpnGeneral"><h2>General</h2></a>
        <table class="summary" id="vpnSummaryTable"></table>
        
        <a name="vpnReplication"><h2>Replication</h2></a>
        <table class="summary" id="vpnSummaryReplTable"></table>
        
        <a name="vpnCountSummary"><h2>Count Summary</h2></a>
        <table class="summary" id="vpnCountSummaryTable"></table>
        
        <a name="vpnLimits"><h2>VPN Limits</h2></a>
        <table class="summary" id="vpnSummaryLimitsTable"></table>
      </div>
      <div id="aclSummary">
        <a name="vpnACLSummary"><h2>ACL Profile Summary</h2></a>
        <table class="summary" id="aclSummaryTable"></table>
      </div>
      
      <div id="cpSummary">
        <a name="vpnCPSummary"><h2>Client Profile Summary</h2></a>
        <table class="summary" id="cpSummaryTable"></table>
      </div>
      
      <div id="cuSummary">
        <a name="vpnCUSummary"><h2>Client Username Summary</h2></a>
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
        throw new Exception("idOrDom must be the TABLE/THEAD Element Id or the Element");
    }
    for (cell of cellArr) {
      tcell = document.createElement("th");
      tcell.textContent = cell;
      headerDom.appendChild(tcell);
    }
    
}

async function updateStatus(line, total, domId) {
    await new Promise(resolve => setTimeout(resolve, 0));
    line = parseInt(line) + 1;
    pct = Math.round(line / total * 100);
    document.getElementById(domId).innerHTML = `Processed ${pct}%`;
}

function updateTableCell(idOrDom, row, col, text, overwrite = true) {
    tableDom = (typeof idOrDom === 'string') ? document.getElementById(idOrDom) : idOrDom;
    bodyDom = null;
    if (tableDom.tagName.toUpperCase() == "TABLE") {
        bodyDom = tableDom.getElementsByTagName("tbody");
        if (bodyDom.length == 1) {
            bodyDom = bodyDom[0];
        } else
            throw new Exception("idOrDom must be the TABLE/TBODY Element Id or the Element");
        
    } else if (tableDom.tagName.toUpperCase() == "TBODY") {
        bodyDom = tableDom;
    } else {
        throw new Exception("idOrDom must be the TABLE/TBODY Element Id or the Element");
    }
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
  }
  let client = [];
  document.getElementById("gatherDiagLinesProcessed").innerHTML = "";
  document.getElementById("clientDetailLinesProcessed").innerHTML = "";
  document.getElementById("currentConfigLinesProcessed").innerHTML = "";
  
  if (document.getElementById("currentConfigFile").files.length > 0)
    broker = await processCLI(files.configCliData, broker);
  if (document.getElementById("clientDetailFile").files.length > 0)
    client = await processClients(files.clientDetailData, client);
  if (document.getElementById("gatherDiagFile").files.length > 0)
    broker = await processGD(files.gatherDiagData, broker);
  brokerData = broker;
  clientData = client;
  setTimeout( () => { parseBrokerJsonAndDisplay(broker); }, 100);
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
    return (err.length == 0) ? null : err;
}

function cleanArr(text) {
  return text.replaceAll('"','').trim().split(/\s+/);
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

function getOverflownLines(lineNum, lines) {
  let text = "";
  // lineNum should be the same line as the field e.g. line 0
  while (lines[++lineNum].startsWith(" ")) {
    text += lines[lineNum].trim();
  }
  return { lineNum: --lineNum, text: text, }
}

function hasProperty(obj, path) {
  if (!obj || typeof obj !== 'object') return false;

  const keys = Array.isArray(path) ? path : path.split('.');

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
