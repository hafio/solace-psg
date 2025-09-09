function getOverflownClientLines(lineNum, lines) {
  let text = "";
  // lineNum should be the same line as the field e.g. line 0
  while (lines[++lineNum].startsWith(" ")) {
    text += lines[lineNum].substr(32);
  }
  return { lineNum: --lineNum, text: text, }
}

function processClients(lines, clients = {}) {
  ln = -1;
  clientLoop: while (++ln < lines.length) {
    // multi-layered looping - Client: as the bigger outer loop, and more switch within each client loop
    // detects Client: line to start client block
    if (lines[ln].startsWith("Client: ")) {
      _TMP = cleanArr(lines[ln]);
      client = {}, clientName = null; // reset client details
      if (/^(?!(#bridge|#config))/.test(_TMP[1])) { // if client name does not start with '#', begin client block. this cannot be combined with 'Client:' because need to save previous block
        clientName = lines[ln].substr(30);
        nameObj = getOverflownClientLines(ln, lines);
        ln = nameObj.lineNum, clientName += nameObj.text;
        while (lines[++ln].trim() != "") { // client details
          _TMP = cleanArr(lines[ln]);
          switch(true) {
            case /^Type\: /.test(lines[ln]):
              client.type = lines[ln].substr(30);
              break;
            case /^Client Profile\: /.test(lines[ln]):
              client.clientProfile = lines[ln].substr(30);
              break;
            case /^ACL Profile\: /.test(lines[ln]):
              client.aclProfile = lines[ln].substr(30);
              break;
            case /^Authorization Group\: /.test(lines[ln]):
              client.authorizationGroup = lines[ln].substr(30);
              break;
            case /^Originating IP Address\: /.test(lines[ln]):
              client.orgIPAddress = (lines[ln].substr(30).trim().length == 0) ? "(unknown)" : lines[ln].substr(30);
              break;
            case /^Client Id\: /.test(lines[ln]):
              client.clientId = lines[ln].substr(30);
              break;
            case /^Message VPN\: /.test(lines[ln]):
              client.msgVpn = lines[ln].substr(30);
              if (client.msgVpn.startsWith("#config"))
                continue clientLoop;
              break;
            case /^Client Username\: /.test(lines[ln]):
              client.username = lines[ln].substr(30);
              break;
            case /^User\: /.test(lines[ln]):
              client.user = lines[ln].substr(30);
              nameObj = getOverflownClientLines(ln, lines);
              ln = nameObj.lineNum, client.user += nameObj.text;
              if (client.user == "SolOS")
                continue clientLoop;
              break;
            case /^Description\: /.test(lines[ln]):
              client.description = lines[ln].substr(30);
              break;
            case /^Software Version\: /.test(lines[ln]):
              client.softwareVersion = (lines[ln].substr(30).trim().length == 0) ? "(unknown)" : lines[ln].substr(30);
              break;
            case /^Software Date\: /.test(lines[ln]):
              client.softwareDate = lines[ln].substr(30);
              nameObj = getOverflownClientLines(ln, lines);
              ln = nameObj.lineNum, client.softwareDate += nameObj.text;
              break;
            case /^Platform\: /.test(lines[ln]):
              client.platform = lines[ln].substr(30);
              nameObj = getOverflownClientLines(ln, lines);
              ln = nameObj.lineNum, client.platform += nameObj.text;
              if (/JMS ?SDK/.test(client.platform)) {
                client.solApi = 'JMS';
              } else if (/JCSMP SDK/.test(client.platform)) {
                client.solApi = 'JCSMP';
              } else if (/C SDK/.test(client.platform)) {
                client.solApi = 'C';
              } else if (/JS API/.test(client.platform)) {
                client.solApi = 'JS';
              } else if (/MQTT Client/i.test(client.platform)) {
                client.solApi = 'MQTT';
              } else if (clientName.startsWith("#amqp")) {
                client.solApi = 'AMQP';
              } else if (clientName.startsWith("#rest")) {
                client.solApi = 'REST';
              } else {
                client.solApi = 'UNKNOWN';
                console.log(client);
              }
              java = client.platform.match(/\(Java ([a-zA-Z0-9_\-\+\. ]+)\)/);
              if (java != null) {
                client.javaVersion = java[1];
              }
              break;
          }
        }
      } else {
        continue;
      }
      if (typeof clientName != 'undefined' && clientName != null) { // save previously populated client block
        if (!hasProperty(clients, client.solApi))
          clients[client.solApi] = {};
        if (!hasProperty(clients[client.solApi], client.softwareVersion.replaceAll('.', '\\.')))
          clients[client.solApi][client.softwareVersion] = {};
        if (!hasProperty(clients[client.solApi][client.softwareVersion], client.msgVpn))
          clients[client.solApi][client.softwareVersion][client.msgVpn] = {};
        if (!hasProperty(clients[client.solApi][client.softwareVersion][client.msgVpn], client.username))
          clients[client.solApi][client.softwareVersion][client.msgVpn][client.username] = {};
        if (!hasProperty(clients[client.solApi][client.softwareVersion][client.msgVpn][client.username], client.orgIPAddress))
          clients[client.solApi][client.softwareVersion][client.msgVpn][client.username][client.orgIPAddress] = [];
        if (!clients[client.solApi][client.softwareVersion][client.msgVpn][client.username][client.orgIPAddress].includes(client.platform))
          clients[client.solApi][client.softwareVersion][client.msgVpn][client.username][client.orgIPAddress].push(client.platform);
        clientName = null, client = null;
      }
      ln--;
    }
  }
  updateStatus(ln, lines.length, "clientDetailLinesProcessed");
  return clients;
}