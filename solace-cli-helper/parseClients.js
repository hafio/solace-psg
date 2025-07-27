function processClients(lines, clients = {}) {
  ln = -1;
  client = [], _TMP = clientName = null;
  while (++ln < lines.length) {
    // multi-layered looping - Client: as the bigger outer loop, and more switch within each client loop
    // detects Client: line to start client block
    if (lines[ln].startsWith("Client: ")) {
      _TMP = cleanArr(lines[ln]);
      if (clientName != null) { // save previously populated client block
        if (!hasProperty(clients, client.solApi))
          clients[client.solApi] = {};
        if (!hasProperty(clients[client.solApi], client.softwareVersion))
          clients[client.solApi][client.softwareVersion] = {};
        if (!hasProperty(clients[client.solApi][client.softwareVersion], client.msgVpn))
          clients[client.solApi][client.softwareVersion][client.msgVpn] = {};
        if (!hasProperty(clients[client.solApi][client.softwareVersion][client.msgVpn], client.username))
          clients[client.solApi][client.softwareVersion][client.msgVpn][client.username] = {};
        if (!hasProperty(clients[client.solApi][client.softwareVersion][client.msgVpn][client.username], client.orgIPAddress))
          clients[client.solApi][client.softwareVersion][client.msgVpn][client.username][client.orgIPAddress] = [];
        if (!clients[client.solApi][client.softwareVersion][client.msgVpn][client.username][client.orgIPAddress].includes(client.platform))
          clients[client.solApi][client.softwareVersion][client.msgVpn][client.username][client.orgIPAddress].push(client.platform);
      }
      client = {}, clientName = null; // reset client details
      if (!_TMP[1].startsWith("#")) { // if client name does not start with '#', begin client block. this cannot be combined with 'Client:' because need to save previous block
        clientName = _TMP[1];
        nameObj = getOverflownLines(ln, lines);
        ln = nameObj.lineNum, clientName += nameObj.text;
        while (!lines[++ln].startsWith("Client: ")) { // client details
          _TMP = cleanArr(lines[ln]);
          switch(true) {
            case /^Type\: /.test(lines[ln]):
              client.type = _TMP[1];
              break;
            case /^Client Profile\: /.test(lines[ln]):
              client.clientProfile = _TMP[2];
              break;
            case /^ACL Profile\: /.test(lines[ln]):
              client.aclProfile = _TMP[2];
              break;
            case /^Authorization Group\: /.test(lines[ln]):
              client.authorizationGroup = _TMP[2];
              break;
            case /^Originating IP Address\: /.test(lines[ln]):
              client.orgIPAddress = _TMP[3];
              break;
            case /^Client Id\: /.test(lines[ln]):
              client.clientId = _TMP[2];
              break;
            case /^Message VPN\: /.test(lines[ln]):
              client.msgVpn = _TMP[2];
              break;
            case /^Client Username\: /.test(lines[ln]):
              client.username = _TMP[2];
              break;
            case /^User\: /.test(lines[ln]):
              client.user = _TMP.splice(2).join(" ");
              nameObj = getOverflownLines(ln, lines);
              ln = nameObj.lineNum, client.user += nameObj.text;
              break;
            case /^Description\: /.test(lines[ln]):
              client.description = _TMP.splice(1).join(" ");
              break;
            case /^Software Version\: /.test(lines[ln]):
              client.softwareVersion = _TMP[2];
              break;
            case /^Software Date\: /.test(lines[ln]):
              client.softwareDate = _TMP.splice(2).join(" ");
              break;
            case /^Platform\: /.test(lines[ln]):
              client.platform = _TMP.splice(1).join(" ");
              nameObj = getOverflownLines(ln, lines);
              ln = nameObj.lineNum, client.platform += nameObj.text;
              if (/JMS ?SDK/.test(client.platform)) {
                client.solApi = 'JMS';
              } else if (/JCSMP SDK/.test(client.platform)) {
                client.solApi = 'JCSMP';
              } else if (/C SDK/.test(client.platform)) {
                client.solApi = 'C';
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
      ln--;
    }
  }
  updateStatus(ln, lines.length, "clientDetailLinesProcessed");
  return clients;
}