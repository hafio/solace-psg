const queuePermissionLevels = {
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
const aclKeywordMapping = {
  "client-connect": "clientConnect",
  "publish-topic": "publishTopic",
  "subscribe-topic": "subscribeTopic",
}

function processCLI(lines, broker = {}) {
  ln = -1;
  while (++ln < lines.length) {
    let _TMP = cleanArr(lines[ln]);
    switch(true) {
// Commented Router Name, not part of actual configuration
      case /^!   Router: /.test(lines[ln]):
        broker._routerName = _TMP[2];
        break;
// INTERFACES
      case /^create interface .+$/.test(lines[ln]):
        broker.intf[_TMP[2]] = { type: _TMP[3], member: [] };
        break;
        
      case /^interface .+$/.test(lines[ln]):
        let intfName = _TMP[1];
        if (typeof broker.intf[intfName] === 'undefined')
          broker.intf[intfName] = { type: "Physical", member: [] };
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          switch (true) {
            case /^  member .+$/.test(lines[ln]):
              broker.intf[intfName].member.push(_TMP[1]);
              break;

            case /^  primary-member .+$/.test(lines[ln]):
              broker.intf[intfName].primaryMember = _TMP[1];
              break;

            case /^  no shutdown$/.test(lines[ln]):
              broker.intf[intfName].enabled = true;
              break

            case /^  shutdown$/.test(lines[ln]):
              broker.intf[intfName].enabled = false;
              break
          }
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;
        
        case /^  vrf "management"$/.test(lines[ln]):
          if (typeof broker.intf.vrfMgmt === 'undefined')
            broker.intf.vrfMgmt = [];
          name = typ = enabled = ip = null;
          while (checkCliExitBlock(lines, ++ln, 4)) {
            _TMP = cleanArr(lines[ln]);
            switch (_TMP[0]) {
              case "create":
                name = _TMP[2];
                typ = _TMP[3];
                break;
                
              case "ip-address":
                ip = _TMP[1];
                break;
                
              case "shutdown":
                enabled = false;
                break;
                
              case "no":
                if (_TMP[1] == "shutdown")
                  enabled = true;
                break;
                
              case "exit":
                broker.intf.vrfMgmt[name] = { enabled: enabled, type: typ, ipAddress: ip, };
                // TODO might want to consider "OR" logic as null values will be treated as false too
                broker.intf.vrfMgmtEnabled = broker.intf.vrfMgmtEnabled || enabled;
                name = typ = enabled = ip = null;
                break;
            }
          }
          updateStatus(ln, lines.length, "currentConfigLinesProcessed");
          break;
        
        case /^  vrf "msg-backbone"$/.test(lines[ln]):
          if (typeof broker.intf.vrfMsg === 'undefined')
            broker.intf.vrfMsg = [];
          name = typ = enabled = ip = null;
          while (checkCliExitBlock(lines, ++ln, 4)) {
            _TMP = cleanArr(lines[ln]);
            switch (_TMP[0]) {
              case "create":
                name = _TMP[2];
                typ = _TMP[3];
                break;

              case "ip-address":
                ip = _TMP[1];
                break;
                
              case "shutdown":
                enabled=false;
                break;

              case "no":
                if (_TMP[1] == "shutdown")
                  enabled = true;
                break;

              case "exit":
                broker.intf.vrfMsg[name] = { enabled: enabled, type: typ, ipAddress: ip };
                broker.intf.vrfMsgEnabled = broker.intf.vrfMsgEnabled || enabled;
                name = typ = enabled = ip = null;
                break;
            }
          }
          updateStatus(ln, lines.length, "currentConfigLinesProcessed");
          break;
        
// SEMP
      case /(no )?service semp listen-port/.test(lines[ln]):
        port = (_TMP[0] == "no") ? "(default)" : _TMP[3];
        (_TMP[4] == "ssl") ? broker.svcs.semp.portSsl = port : broker.svcs.semp.port = port;
        // TODO OUTPUT TO TABLE. SHOULD HAVE FIXED TABLE WITH FIXED ELEMENTS
        break;

      case /(no )?service semp shutdown/.test(lines[ln]):
        enabled = (_TMP[0] == "no") ? true : false;
        (lines[ln].endsWith("ssl")) ? broker.svcs.semp.sslEnabled = enabled : broker.svcs.semp.plainEnabled = enabled;
        // TODO OUTPUT TO TABLE. SHOULD HAVE FIXED TABLE WITH FIXED ELEMENTS
        break;
      
      case /(no )?service semp cors allow-any-host/.test(lines[ln]):
        broker.svcs.semp.corsAllow = (_TMP[0] == "no") ? false : true;
        // TODO OUTPUT TO TABLE. SHOULD HAVE FIXED TABLE WITH FIXED ELEMENTS
        break;
        
// SMF
      case /(no )?service smf shutdown/.test(lines[ln]):
        broker.svcs.smf.enabled = (_TMP[0] == "no") ? true : false;
        break;
      
      case /(no )?service smf listen-port/.test(lines[ln]):
        port = (_TMP[0] == "no") ? "(default)" : _TMP[3];
        if (_TMP[4] == "ssl")
          broker.svcs.smf.portSsl = port;
        else if (_TMP[4] == "routing")
          broker.svcs.smf.portRouting = port;
        else if (_TMP[4] == "compressed")
          broker.svcs.smf.portCompressed = port;
        else
          broker.svcs.smf.port = port;
        break;
        
// WEB SMF
      case /(no )?service web-transport shutdown/.test(lines[ln]):
        broker.svcs.web.enabled = (_TMP[0] == "no") ? true : false;
        break;
      
      case /(no )?service web-transport listen-port/.test(lines[ln]):
        port = (_TMP[0] == "no") ? "(default)" : _TMP[3];
        (_TMP[4] == "ssl") ? broker.svcs.web.portSsl = port : broker.svcs.web.port = port;
        break;

// Virtual Hostname TODO ADD A SECTION TO DETECT VIRTUAL HOSTNAME

// REST
      case /(no )?service rest (incoming|outgoing) shutdown/.test(lines[ln]):
        enabled = (_TMP[0] == "no") ? true : false;
        broker.svcs.rest[_TMP[2+enabled]+'Enabled'] = enabled;
        break;

// MQTT
      case /(no )?service mqtt shutdown/.test(lines[ln]):
        broker.svcs.mqtt.enabled = (_TMP[0] == "no") ? true : false;
        break;

// AMQP
      case /(no )?service amqp shutdown/.test(lines[ln]):
        broker.svcs.amqp.enabled = (_TMP[0] == "no") ? true : false;
        break;

      case /^(no )?service amqp listen-port/.test(lines[ln]): // this is global amqp service, differentiated by no spaces in the front.
        port = (_TMP[0] == "no") ? "(default)" : _TMP[3];
        (_TMP[4] == "ssl") ? broker.svcs.amqp.portSsl = port : broker.svcs.amqp.port = port;
        break;

// HEALTH CHECK
      case /service health-check shutdown/.test(lines[ln]):
        broker.svcs.healthcheck.enabled = (_TMP[0] == "no") ? true : false;
        break;

      case /^(no )?service health-check listen-port/.test(lines[ln]): // this is health check service, differentiated by no spaces in the front.
        if (_TMP[0] == "no") {
          if (_TMP[4] == "ssl")
            broker.svcs.healthcheck.portSsl = "(not configured)";
          else
            broker.svcs.healthcheck.port = "(default)";
        } else {
          if (_TMP[4] == "ssl")
            broker.svcs.healthcheck.portSsl = _TMP[3];
          else
            broker.svcs.healthcheck.port = _TMP[3];
        }
        break;

// DNS
      case /^dns$/.test(lines[ln]):
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          if (_TMP[0] == "name-server")
            broker.dns.ns.push(_TMP[1]);
          else if (_TMP[0] == "polled-domain-name")
            broker.dns.polledDNS = _TMP[1];
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;

// HOSTNAME
      case /^hostname/.test(lines[ln]):
        broker.hostname = _TMP[1];
        break;

// ROUTER-NAME
      case /^(no )?router-name/.test(lines[ln]):
        broker.routerName = (_TMP[0] == "no") ? "(not configured)" : _TMP[1];
        break;

// MNR & DMR (under routing)
      case /^routing$/.test(lines[ln]):
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          if (_TMP.length == 1 && _TMP[0] == "multi-node-routing") {
            while (checkCliExitBlock(lines, ++ln, 4)) {
              //_TMP = cleanArr(lines[ln]);
              if (lines[ln] == "    no shutdown")
                broker.mnr = { enabled: true };
              else if (lines[ln] == "    shutdown")
                broker.mnr = { enabled: false };
            }
          } else if (_TMP.length == 1 && _TMP[0] == "dynamic-message-routing") {
            while (checkCliExitBlock(lines, ++ln, 4)) {
              // DO NOTHING FOR NOW AS PSA DOESN'T HAVE DMR
              // TODO ADD IN DMR DETAILS
            }
            broker.dmr = "TODO";
          }
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;

// TODO REDUNDANCY SERVICE (SEEMS TO BE ONLY FOR SOFTWARE)
// REDUNDANCY (BELOW IS ONLY FOR HARDWARE)
      case /^redundancy mate-router-name/.test(lines[ln]):
        broker.redundancy.mate = _TMP[2];
        break;
        
      case /^redundancy active-standby-role/.test(lines[ln]):
        broker.redundancy.role = _TMP[2];
        break;
        
      case /redundancy shutdown/.test(lines[ln]):
        broker.redundancy.enabled = (_TMP[0] == "no") ? true : false;
        break;
      
      case /^hardware power-redundancy/.test(lines[ln]):
        broker.redundancy.power = _TMP[2];
        break;
// TODO ADD REPLICATION PSK
// REPLICATION FOR APPLIANCE
      case /(no )?replication mate connect-port/.test(lines[ln]):
        port = (_TMP[0] == "no") ? "(not configured)" : _TMP[3];
        if (lines[ln].endsWith("ssl"))
          broker.replication.portSsl = port;
        else if (lines[ln].endsWith("compressed"))
          broker.replication.portCompressed = port;
        else
          broker.replication.port = port;
        break;
// REPLICATION FOR SOFTWARE       
      case /^(no )?replication mate connect-via/.test(lines[ln]):
        (_TMP[0] == "no") ? url = port = "(not configured)" : [url, port] = _TMP[3].split(":");
        if (lines[ln].endsWith("ssl")) {
          broker.replication.connectViaSsl = url;
          broker.replication.portSsl = port;
        } else if (lines[ln].endsWith("compressed")) {
          broker.replication.connectViaCompressed = url;
          broker.replication.portCompressed = port;
        } else {
          broker.replication.connectVia = url;
          broker.replication.port = port;
        }
        break;
// REPLICATION FOR BOTH APPLIANCE & SOFTWARE
      case /^(no )?replication mate virtual-router-name/.test(lines[ln]):
        if (_TMP[0] == "no") {
          broker.replication.mate = "(not configured)";
        } else {
          broker.replication.mate = _TMP[3];
          if (_TMP[4] == "connect-via")
            broker.replication.connectVia = broker.replication.connectViaSsl = broker.replication.connectViaCompressed = _TMP[5];
        }
        break;
      case /^(no )?replication config-sync bridge shutdown/.test(lines[ln]):
        broker.replication.enabled = (_TMP[0] == "no") ? true : false;
        break;
      case /^(no )?replication config-sync bridge/.test(lines[ln]):
        enable = true;
        if (_TMP[0] == "no") {
          enable = false;
          _TMP = _TMP.splice(1);
        }
        if (_TMP[3] == "ssl")
          broker.replication.sslEnabled = enabled;
        else if (_TMP[3] == "compressed-data")
          broker.replication.compressedEnabled = enabled;
        break;

// MESSAGE BACKBONE
      case /(no )?service msg-backbone shutdown/.test(lines[ln]):
        broker.msgBackboneEnabled = (_TMP[0] == "no") ? true : false;
        break;

// HARDWARE MESSAGE SPOOL
      case /^hardware message-spool disk-array wwn/.test(lines[ln]):
        broker.msgSpool.diskArrayWwn = _TMP[4];
        break;
      case /^hardware message-spool max-spool-usage/.test(lines[ln]):
        broker.msgSpool.maxUsage = parseInt(_TMP[3]);
        break;

// DEFRAGMENTATION
      case /(no )?hardware message-spool defragment-spool-files schedule (days|times|shutdown)/.test(lines[ln]):
        enabled = (_TMP[0] == "no") ? true : false;
        if (lines[ln].endsWith("shutdown"))
          broker.defrag.schedule.enabled = enabled;
        else
          broker.defrag.schedule[_TMP[4+enabled]] = (_TMP[0] == "no") ? "(default)" : _TMP[5];
        break;

      case /(no )?hardware message-spool defragment-spool-files threshold/.test(lines[ln]):
        enabled = (_TMP[0] == "no") ? true : false;
        if (_TMP[4+enabled] == "shutdown")
          broker.defrag.threshold.enabled = enabled;
        else if (_TMP[4+enabled] == "fragmentation-percentage")
          broker.defrag.threshold.fragmentation = (_TMP[0] == "no") ? "(default)" : _TMP[5];
        else if (_TMP[4+enabled] == "usage-percentage")
          broker.defrag.threshold.diskUsed = (_TMP[0] == "no") ? "(default)" : _TMP[5];
        else if (_TMP[4+enabled] == "min-interval")
          broker.defrag.threshold.interval = (_TMP[0] == "no") ? "(default)" : _TMP[5];
        break;

// TIMEZONE
      case /^clock timezone/.test(lines[ln]):
        broker.timezone = _TMP[2];
        break;

// MQTT
      case /^(no )?mqtt retain max-memory/.test(lines[ln]):
        broker.mqtt.maxMemory = (_TMP[0] == "no") ? "(default)" : parseInt(_TMP[3]);
        break;

// CLOCK SYNCHRONIZATION
      case /ntp-server/.test(lines[ln]):
        broker.ntp.server.push(_TMP[1]);
        while (checkCliExitBlock(lines, ++ln, 4)) {
          if (lines[ln] == "    no shutdown")
            broker.ntp.enabled = true;
          else if (lines[ln] == "    shutdown")
            broker.ntp.enabled = false;
        }
        break;

// SYSLOG
      case /^create syslog/.test(lines[ln]):
        syslog = _TMP[2], fac = [],host = [];
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          if (_TMP[0] == "facility")
            fac.push(_TMP[1]);
          else if (_TMP[0] == "host")
            host.push({ url: _TMP[1], transport: _TMP[3]});
        }
        broker.syslog.push({ name: syslog, facility: fac, host: host});
        break;
        
// BACKUP
      case /^(no )?schedule backup/.test(lines[ln]):
        if (_TMP[0] == "no")
          broker.backup.enabled = false;
        else {
          broker.backup.enabled = true;
          broker.backup.days = _TMP[3];
          broker.backup.times = _TMP[5];
          broker.backup.maxBackups = _TMP[7];
        }
        break;
        
// SNMP TODO
// LOGGING TODO
// SSL TODO

// CONFIG-SYNC
      case /^(no )?config-sync shutdown/.test(lines[ln]):
        broker.configSync.enabled = (_TMP[0] == "no") ? true : false;
        break;
      case /^(no )?config-sync ssl/.test(lines[ln]):
        broker.configSync.sslEnabled = (_TMP[0] == "no")? true : false;
        break;
      case /^(no )?config-sync username/.test(lines[ln]):
        broker.configSync.syncUsername = (_TMP[0] == "no")? false : true;
        break;
        
// USERNAMES
      case /^create username/.test(lines[ln]):
        accessObj = processGlobalDefaultAccess(++ln, lines);
        broker.username[_TMP[2]] = { type: _TMP[5], ...accessObj.obj };
        ln = accessObj.lineNum;
        break;

// OAUTH PROFILE TODO        

// LDAP PROFILE
// TODO ADD MORE PROPERTIES
      case /^  (create )?ldap-profile/.test(lines[ln]):
        name = null, tlsEnabled = null, enabled = null;
        name = (_TMP[0] == "create") ? _TMP[2] : _TMP[1];
        while (checkCliExitBlock(lines, ++ln, 4)) {
          _TMP = cleanArr(lines[ln]);
          if (lines[ln] == "    shutdown")
            enabled = false;
          else if (lines[ln] == "    no shutdown")
            enabled = true;
          else if (lines[ln] == "    starttls")
            tlsEnabled = true;
          else if (lines[ln] == "    no starttls")
            tlsEnabled = false;
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        broker.ldap[name] = { enabled: enabled, tlsEnabled: tlsEnabled, };
        break;
        
// RADIUS PROFILE TODO
        
// DOMAIN CERTIFICATE AUTHORITY
      case /^  create domain-certificate-authority/.test(lines[ln]):
        broker.domainCertAuthority.push(_TMP[2]);
        break;
        
// SEMP AUTH-TYPE
      case /^  auth-type/.test(lines[ln]):
        broker.semp.authType = _TMP[1];
        if (typeof _TMP[2] !== 'undefined')
          broker.semp.authGroupName = _TMP[2];
        break;
// SEMP AUTHENTICATION ACCESS-LEVEL
      case /^  access-level$/.test(lines[ln]):
        while (checkCliExitBlock(lines, ++ln, 4)) {
          _TMP = cleanArr(lines[ln]);
          if (_TMP[0] == "default") {
            accessObj = processGlobalDefaultAccess(++ln, lines);
            broker.semp.accessLevel.default = accessObj.obj;
            ln = accessObj.lineNum;
          } else if (_TMP[0] == "ldap") {
            while (checkCliExitBlock(lines, ++ln, 6)) {
              _TMP = cleanArr(lines[ln]);
              if (_TMP[0] == "group-membership-attribute-name")
                broker.semp.accessLevel.ldap.grpMemAttrName = _TMP[1];
              else if (_TMP[0] == "create" && _TMP[1] == "group") {
                accessObj = processGlobalDefaultAccess(++ln, lines);
                groupName = _TMP.splice(2).join(" ");
                broker.semp.accessLevel.ldap.group[groupName] = accessObj.obj;
                ln = accessObj.lineNum;
              }
            }
            updateStatus(ln, lines.length, "currentConfigLinesProcessed");
          }
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;
////////////////////////////////////////////////////////////
// VPN SPECIFIC BLOCK
////////////////////////////////////////////////////////////
      case lines[ln].startsWith("message-vpn "):
        vpnName = _TMP[1];
        if (typeof broker.vpn[vpnName] === 'undefined')
          broker.vpn[vpnName] = {
            name: vpnName,
            authentication: { basic: {}, clientCertificate: {}, oauth: {}, },
            authorization: { group: {} },
            svc: { smf: {}, web: {}, rest: {}, mqtt: {}, amqp: {}, },
            replication: { replicatedTopic: [], },
            dmr: {},
            aclProfile: {},
            aclProfileCount: 0,
            clientProfile: {},
            clientProfileCount: 0,
            clientUsername: {},
            clientUsernameCount: 0,
            queue: {},
            queueCount: 0,
            topicEndpoint: {}, 
            topicEndpointCount: 0,
            bridge: {},
            bridgeCount: 0,
            cumulativeMaxSpoolUsage: 0,
            cumulativeMaxConnectionsFromClientUsername: 0,
          };
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          switch (true) {
      // AUTHENTICATION
            case (_TMP[0] == "authentication"):
              while (checkCliExitBlock(lines, ++ln, 4)) {
                _TMP = cleanArr(lines[ln]);
                switch (true) {
          // BASIC
                  case /basic auth-type/.test(lines[ln]):
                    broker.vpn[vpnName].authentication.basic.authType = _TMP[2];
                    break;
                  case /(no )?basic shutdown/.test(lines[ln]):
                    broker.vpn[vpnName].authentication.basic.enabled = (_TMP[0] == "no") ? true : false;
                    break;
          // BASIC: RADIUS
                  case /(no )?basic radius-domain/.test(lines[ln]):
                    broker.vpn[vpnName].authentication.basic.radiusDomain = (_TMP[0] == "no") ? "(not configured)" : _TMP[2];
                    break;
          // BASIC: CLIENT CERTIFICATE
            // SEEMS TO BE SOFTWARE SETTING (TBC) TODO TODO TODO
                  case /(no )?client-certificate shutdown/.test(lines[ln]):
                    broker.vpn[vpnName].authentication.clientCertificate.enabled = (_TMP[0] == "no") ? true : false;
                    break;
            // SEEMS TO BE APPLIANCE SETTING (TBC) TODO
                  case /^    client-certificate$/.test(lines[ln]):
                    while (checkCliExitBlock(lines, ++ln, 6)) {
                      if (/^      no shutdown/.test(lines[ln])) {
                        broker.vpn[vpnName].authentication.clientCertificate.enabled = true;
                      } else if (/^      shutdown/.test(lines[ln])) {
                        broker.vpn[vpnName].authentication.clientCertificate.enabled = false;
                      }
                    }
                    break;
          // BASIC: OAUTH
                  case /(no )?oauth default-provider/.test(lines[ln]):
                    if (_TMP[0] == "no")
                      broker.vpn[vpnName].authentication.oauth.defaultProvider = "(not configured)";
                    else
                      broker.vpn[vpnName].authentication.oauth.defaultProvider = _TMP[2];
                    break;
                  case /(no )?oauth shutdown/.test(lines[ln]):
                    broker.vpn[vpnName].authentication.oauth.enabled = (_TMP[0] == "no") ? true : false;
                    break;
                }
              }
              updateStatus(ln, lines.length, "currentConfigLinesProcessed");
              break;
      // AUTHORIZATION
            case (_TMP[0] == "authorization"):
              while (checkCliExitBlock(lines, ++ln, 4)) {
                _TMP = cleanArr(lines[ln]);
                switch (true) {
                  case /(no )?authorization-type (internal|ldap)/.test(lines[ln]):
                    broker.vpn[vpnName].authorization.authType = (_TMP[0] == "no") ? "internal" : _TMP[1];
                    break;
                  case /(no )?ldap group-membership-attribute-name/.test(lines[ln]):
                    broker.vpn[vpnName].authorization.ldapGrpMemAttrName = (_TMP[0] == "no") ? "(not configured)" : _TMP[2];
                    break;
                  case /create authorization-group/.test(lines[ln]):
                    authGrp = { name: _TMP[2], };
                    while (checkCliExitBlock(lines, ++ln, 6)) {
                      _TMP = cleanArr(lines[ln]);
                      if (_TMP[0] == "acl-profile")
                        authGrp.aclProfile = _TMP[1];
                      else if (_TMP[0] == "client-profile")
                        authGrp.clientProfile = _TMP[1]
                      else if (_TMP[0] == "no" && _TMP[1] == "shutdown")
                        authGrp.enabled = true;
                      else if (_TMP[0] == "shutdown")
                        authGrp.enabled = false;
                    }
                    broker.vpn[vpnName].authorization.group = { ...authGrp };
                    break;
                }
              }
              updateStatus(ln, lines.length, "currentConfigLinesProcessed");
              break;
      // VPN SERVICES
            case (lines[ln].startsWith("  max-connections")):
              broker.vpn[vpnName].maxConnections = parseInt(_TMP[1]);
              break;
            case /^  service (smf|mqtt|amqp) max-connections/.test(lines[ln]):
              broker.vpn[vpnName].svc[_TMP[1]].maxConnections = parseInt(_TMP[3]);
              break;
            case /^  service web-transport max-connections/.test(lines[ln]):
              broker.vpn[vpnName].svc.web.maxConnections = parseInt(_TMP[3]);
              break;
            case /^  service rest (incoming|outgoing) max-connections/.test(lines[ln]):
              broker.vpn[vpnName].svc.rest[_TMP[2] + 'maxConnections'] = parseInt(_TMP[4]);
              break;
            case (/(no )?semp-over-msgbus shutdown/.test(lines[ln])):
              broker.vpn[vpnName].sempOverMsgBusEnabled = (_TMP[0] == "no") ? true : false;
              break;
            case /(no )?service (smf|mqtt|amqp) (plain-text|ssl) shutdown$/.test(lines[ln]):
              enabled = (_TMP[0] == "no") ? true : false;
              (_TMP[2+enabled] == "ssl") ? broker.vpn[vpnName].svc[_TMP[1+enabled]].sslEnabled = enabled : broker.vpn[vpnName].svc[_TMP[1+enabled]].plainEnabled = enabled;
              break;
            case /(no )?service web-transport (plain-text|ssl) shutdown$/.test(lines[ln]):
              enabled = (_TMP[0] == "no") ? true : false;
              (_TMP[2+enabled] == "ssl") ? broker.vpn[vpnName].svc.web.sslEnabled = enabled : broker.vpn[vpnName].svc.web.plainEnabled = enabled;
              break;
            case /(no )?service rest incoming (plain-text|ssl) shutdown$/.test(lines[ln]):
              enabled = (_TMP[0] == "no") ? true : false;
              (_TMP[3+enabled] == "ssl") ? broker.vpn[vpnName].svc.rest.incomingSslEnabled = enabled : broker.vpn[vpnName].svc.rest.incomingPlainEnabled = enabled;
              break;
            case /(no )?service mqtt websocket(-secure)? shutdown$/.test(lines[ln]):
              enabled = (_TMP[0] == "no") ? true : false;
              (_TMP[2+enabled] == "websocket-secure") ? broker.vpn[vpnName].svc.mqtt.wssEnabled = enabled : broker.vpn[vpnName].svc.mqtt.wsEnabled = enabled;
              break;
            case (lines[ln]).startsWith("service rest mode "):
              broker.vpn[vpnName].rest.mode = _TMP[3];
              break;
              
      // VPN LEVEL REPLICATION
            case (_TMP[0] == "replication"):
              while (checkCliExitBlock(lines, ++ln, 4)) {
                _TMP = cleanArr(lines[ln]);
                switch (true) {
                  case /(no )?ack-propagation shutdown/.test(lines[ln]):
                    broker.vpn[vpnName].replication.ackPropagation = (_TMP[0] == "no") ? true : false;
                    break;
                  case /transaction-replication-mode/.test(lines[ln]):
                    broker.vpn[vpnName].replication.txnRepMode = _TMP[1];
                    break;
                  case /create replicated-topic/.test(lines[ln]):
                    topic = _TMP[2];
                    break;
                  case /^    bridge authentication auth-scheme/.test(lines[ln]):
                    broker.vpn[vpnName].replication.authScheme = _TMP[3];
                    break;
                  case /^    (no )?bridge authentication basic client-username/.test(lines[ln]):
                    broker.vpn[vpnName].replication.basicUser = (_TMP[0] == "no") ? "(none)" : _TMP[4];
                    break;
                  case (_TMP[0] == "replication-mode"):
                    broker.vpn[vpnName].replication.replicatedTopic.push({topic: topic, mode: _TMP[1]});
                    break;
                  case /^    state "(active|standby)"/.test(lines[ln]):
                    broker.vpn[vpnName].replication.state = _TMP[1];
                    break
                  case /^    (no )?bridge ssl/.test(lines[ln]):
                    broker.vpn[vpnName].replication.sslEnabled = (_TMP[0] == "no") ? false : true;
                    break;
                  case /^    (no )?queue reject-msg-to-sender-on-discard/.test(lines[ln]):
                    broker.vpn[vpnName].replication.rejectMsgOnDiscard = (_TMP[0] == "no") ? false : true;
                    break;
                  case /^    (no )?shutdown/.test(lines[ln]):
                    broker.vpn[vpnName].replication.enabled = (_TMP[0] == "no") ? true : false;
                    break;
                }
              }
              updateStatus(ln, lines.length, "currentConfigLinesProcessed");
              break;
            case /(no )?ssl allow-downgrade-to-plain-text/.test(lines[ln]):
              broker.vpn[vpnName].svc.smf.allowPlainTextDowngrade = (_TMP[0] == "no") ? true : false;
              break;
            case (lines[ln] == "  dynamic-message-routing"):
              while (checkCliExitBlock(lines, ++ln, 4)) {
                 //_TMP = cleanArr(lines[ln]);
                if (lines[ln] == "    no shutdown")
                  broker.vpn[vpnName].dmr.enabled = true;
                if (lines[ln] == "    shutdown")
                  broker.vpn[vpnName].dmr.enabled = false;
              }
              updateStatus(ln, lines.length, "currentConfigLinesProcessed");
              break;
            case /^  (no )?shutdown/.test(lines[ln]):
              broker.vpn[vpnName].enabled = (_TMP[0] == "no") ? true : false;
              break;
          }
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;
        
////////////////////////////////////////////////////////////
// CLIENT PROFILE SPECIFIC BLOCK
////////////////////////////////////////////////////////////
      case /^client-profile .+ message-vpn .+/.test(lines[ln]):
        cpName = _TMP[1], vpnName = _TMP[3];
        broker.vpn[vpnName].clientProfile[cpName] = { mappedClientUsername: [], perClientUsername: {}, perClient: {}, };
        broker.vpn[vpnName].clientProfileCount = Object.keys(broker.vpn[vpnName].clientProfile).length;
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          switch (true) {
            case /(no )?allow-bridge-connections/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].allowBridgeConnections = (_TMP[0] == "no") ? true : false;
              break;
            case /(no )?allow-shared-subscriptions/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].allowSharedSubscriptions = (_TMP[0] == "no") ? true : false;
              break;
            case /(no )?message-spool allow-guaranteed-endpoint-create/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].allowGuaranteedEndpointCreate = (_TMP[0] == "no") ? true : false;
              break;
            case /(no )?message-spool allow-guaranteed-message-receive/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].allowGuaranteedMsgReceive = (_TMP[0] == "no") ? true : false;
              break;
            case /(no )?message-spool allow-guaranteed-message-send/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].allowGuaranteedMsgSend = (_TMP[0] == "no") ? true : false;
              break;
            case /(no )?message-spool allow-transacted-sessions/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].allowTransactedSession = (_TMP[0] == "no") ? true : false;
              break;
            case /message-spool max-transacted-sessions/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClient.maxTransactedSession = parseInt(_TMP[2]);
              break;
            case /message-spool max-transactions/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClient.maxTransactions= parseInt(_TMP[2]);
              break;
            case /message-spool max-messages-per-transaction/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClient.maxMsgTransaction = parseInt(_TMP[2]);
              break;
            case /message-spool max-egress-flows/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClient.maxEgress = parseInt(_TMP[2]);
              break;
            case /message-spool max-ingress-flows/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClient.maxIngress = parseInt(_TMP[2]);
              break;
            case /service smf max-connections-per-client-username/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClientUsername.smfMaxConnections = parseInt(_TMP[3]);
              break;
            case /service web-transport max-connections-per-client-username/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClientUsername.webMaxConnections = parseInt(_TMP[3]);
              break;
            case /max-connections-per-client-username/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClientUsername.maxConnections = parseInt(_TMP[1]);
              break;
            case /message-spool max-endpoints-per-client-username/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].perClientUsername.maxEndpoints = parseInt(_TMP[2]);
              break;
            case /(no )?replication allow-clients-when-standby/.test(lines[ln]):
              broker.vpn[vpnName].clientProfile[cpName].allowConnectionWhenVpnStandby = (_TMP[0] == "no") ? true : false;
              break;
          }
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;
        
////////////////////////////////////////////////////////////
// MESSAGE-SPOOL / QUEUE SPECIFIC BLOCK
////////////////////////////////////////////////////////////
      case /^message-spool message-vpn .+/.test(lines[ln]):
        vpnName = _TMP[2];
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          switch (_TMP[0]) {
            case "max-spool-usage":
              broker.vpn[vpnName].maxSpoolUsage = parseInt(_TMP[1]);
              break;
            case "max-transacted-sessions":
              broker.vpn[vpnName].maxTransactedSessions = parseInt(_TMP[1]);
              break;
            case "max-transactions":
              broker.vpn[vpnName].maxTransactions = parseInt(_TMP[1]);
              break;
            case "max-endpoints":
              broker.vpn[vpnName].maxEndpoints = parseInt(_TMP[1]);
              break;
            case "max-egress-flows":
              broker.vpn[vpnName].maxEgress = parseInt(_TMP[1]);
              break;
            case "max-ingress-flows":
              broker.vpn[vpnName].maxIngress = parseInt(_TMP[1]);
              break;
      // QUEUES & TOPIC ENDPOINTS
            case "create":
              endpointName = _TMP[2];
              if (_TMP[1] == "topic-endpoint") {
                endpointType =  "topicEndpoint";
                broker.vpn[vpnName][endpointType][endpointName] = {};
              } else {
                endpointType =  "queue";
                broker.vpn[vpnName][endpointType][endpointName] = { subscriptionTopic: [], };
                
              }
              broker.vpn[vpnName][endpointType + 'Count'] = Object.keys(broker.vpn[vpnName][endpointType]).length;
              while (checkCliExitBlock(lines, ++ln, 4)) {
                _TMP = cleanArr(lines[ln]);
                switch (true) {
                  case (_TMP[0] == "access-type"):
                    broker.vpn[vpnName][endpointType][endpointName].accessType = _TMP[1];
                    break;
                  case (_TMP[0] == "max-bind-count"):
                    broker.vpn[vpnName][endpointType][endpointName].maxBind = parseInt(_TMP[1]);
                    break;
                  case (_TMP[0] == "max-delivered-unacked-msgs-per-flow"):
                    broker.vpn[vpnName][endpointType][endpointName].maxUnackedMsgsPerFlow = parseInt(_TMP[1]);
                    break;
                  case (_TMP[0] == "max-message-size"):
                    broker.vpn[vpnName][endpointType][endpointName].maxMsgSize = parseInt(_TMP[1]);
                    break;
                  case (_TMP[0] == "max-spool-usage"):
                    broker.vpn[vpnName][endpointType][endpointName].maxSpoolUsage = _TMP[1];
                    broker.vpn[vpnName].cumulativeMaxSpoolUsage += parseInt(_TMP[1]);
                    break;
                  case /^    (no )?topic/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].topic = (_TMP[0] == "no") ? "(none)" : _TMP[1];
                    break;
                  case /^    (no )?owner/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].owner = (_TMP[0] == "no") ?  "(none)" : _TMP[1];
                    break;
                  case /^    (no )?permission/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].permission = (_TMP[0] == "no") ? "no-access" : _TMP[2];
                    broker.vpn[vpnName][endpointType][endpointName].permissionLevel = queuePermissionLevels[broker.vpn[vpnName][endpointType][endpointName].permission];
                    break;
                  case (_TMP[0] == "partition"):
                    if (_TMP[1] == "count")
                      broker.vpn[vpnName][endpointType][endpointName].partitionCount = parseInt(_TMP[2]);
                    break;
                  case /(no )?redelivery/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].redeliveryEnabled = (_TMP[0] == "no") ? true : false;
                    break;
                  case /(no )?reject-msg-to-sender-on-discard/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].rejectOnDiscard = (_TMP[0] == "no") ? true : false;
                    break;
                  case /(no )?reject-low-priority-msg-limit/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].rejectLowPriorityMsgOnLimit = (_TMP[0] == "no") ? true : false;
                    break;
                  case /(no )?shutdown egress/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].egressEnabled = (_TMP[0] == "no") ? true : false;
                    break;
                  case /(no )?shutdown ingress/.test(lines[ln]):
                    broker.vpn[vpnName][endpointType][endpointName].ingressEnabled = (_TMP[0] == "no") ? true : false;
                    break;
                  case /subscription topic/.test(lines[ln]):
                    //strLen = lines[ln].length - 24; // as spaces are valid in topic strings, this is to handle and simply take the line substr, minus "trailing external" as that indicates topic not created by CLI
                    //if (_TMP[_TMP.length-1] == "external")
                    //  strLen = strLen - 9; // " external" = 9 characters
                    broker.vpn[vpnName][endpointType][endpointName].subscriptionTopic.push(_TMP[2]);
                    break;
                }
              }
              updateStatus(ln, lines.length, "currentConfigLinesProcessed");
              break;
          }
        }
        break;

////////////////////////////////////////////////////////////
// ACL PROFILE SPECIFIC BLOCK
////////////////////////////////////////////////////////////
      case /^acl-profile .+ message-vpn .+/.test(lines[ln]):
        aclName = _TMP[1];
        vpnName = _TMP[3];
        broker.vpn[vpnName].aclProfile[aclName] = { clientConnectException: [], publishTopicSmfException:[], subscribeTopicSmfException: [], publishTopicMqttException:[], subscribeTopicMqttException: [], mappedClientUsername: [] };
        broker.vpn[vpnName].aclProfileCount = Object.keys(broker.vpn[vpnName].aclProfile).length;
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          if (_TMP[1] == "default-action") {
            field = aclKeywordMapping[_TMP[0]] + "DefaultAction";
            broker.vpn[vpnName].aclProfile[aclName][field] = _TMP[2];
          } else if (_TMP[1].startsWith("exception")) {
            if (_TMP[0] == "client-connect")
              broker.vpn[vpnName].aclProfile[aclName].clientConnectException.push(_TMP[2]);
            else { // publish-topic + subscribe-topic
              field = aclKeywordMapping[_TMP[0]] + capitalizeWord(_TMP[2]) + "Exception";
              broker.vpn[vpnName].aclProfile[aclName][field] = _TMP.splice(4);
            }
            field = capitalizeWord(_TMP[2]) + "Exception";
            value = _TMP.splice(4);
          }
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;

////////////////////////////////////////////////////////////
// CLIENT USERNAME SPECIFIC BLOCK
////////////////////////////////////////////////////////////
      case /(create )?client-username .+ message-vpn .+/.test(lines[ln]):
        if (_TMP[0] == "create")
          _TMP.splice(0, 1);
        usrName = _TMP[1], vpnName = _TMP[3];
        broker.vpn[vpnName].clientUsername[usrName] = {};
        broker.vpn[vpnName].clientUsernameCount = Object.keys(broker.vpn[vpnName].clientUsername).length;
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]), profile = "";
          if (_TMP[0] == "acl-profile") {
            profile = _TMP[1];
            broker.vpn[vpnName].clientUsername[usrName].aclProfile = profile;
            // add to acl profile
            if (!_TMP[1].startsWith("#") && !broker.vpn[vpnName].aclProfile[profile].mappedClientUsername.includes(usrName))
                broker.vpn[vpnName].aclProfile[profile].mappedClientUsername.push(usrName);
          } else if (_TMP[0] == "client-profile") {
            profile = _TMP[1];
            broker.vpn[vpnName].clientUsername[usrName].clientProfile = profile;
            // add to client profile
            if (!_TMP[1].startsWith("#")) {
              if (!broker.vpn[vpnName].clientProfile[profile].mappedClientUsername.includes(usrName))
                broker.vpn[vpnName].clientProfile[profile].mappedClientUsername.push(usrName);
            // add properties from client profile
              broker.vpn[vpnName].clientUsername[usrName].maxConnectionFromClientProfile = broker.vpn[vpnName].clientProfile[profile].perClientUsername.maxConnections;
            // add properties to cumulative
              broker.vpn[vpnName].cumulativeMaxConnectionsFromClientUsername += broker.vpn[vpnName].clientUsername[usrName].maxConnectionFromClientProfile;
            }
          } else if (_TMP[0] == "no" && _TMP[1] == "shutdown")
            broker.vpn[vpnName].clientUsername[usrName].enabled = true;
          else if (_TMP[0] == "shutdown")
            broker.vpn[vpnName].clientUsername[usrName].enabled = false;
        }
        updateStatus(ln, lines.length, "currentConfigLinesProcessed");
        break;

////////////////////////////////////////////////////////////
// BRIDGE PROFILE SPECIFIC BLOCK
////////////////////////////////////////////////////////////
      case /^create bridge .+ message-vpn .+/.test(lines[ln]):
        vpnName = _TMP[4], bridgeName = _TMP[2], broker.vpn[_TMP[4]].bridge[_TMP[2]] = { remoteVpn: [], remoteVpnNames: [], remoteVpnSslEnabled: [] };
        broker.vpn[vpnName].bridgeCount = Object.keys(broker.vpn[vpnName].bridge).length;
        while (checkCliExitBlock(lines, ++ln, 2)) {
          _TMP = cleanArr(lines[ln]);
          if (_TMP[0] == "authentication") {
            while (checkCliExitBlock(lines, ++ln, 6)) {
              _TMP = cleanArr(lines[ln]);
              if (_TMP[0] == "auth-scheme")
                broker.vpn[vpnName].bridge[bridgeName].authScheme = _TMP[1];
              else if (_TMP[0] == "basic" && _TMP[1] == "client-username") {
                broker.vpn[vpnName].bridge[bridgeName].basicUser = _TMP[2];
              }
            }
          } else if (_TMP[0] == "create" && _TMP[1] == "message-vpn") {
            remoteVpn = { vpn: _TMP[2], connectVia: _TMP[4], };
            if (!broker.vpn[vpnName].bridge[bridgeName].remoteVpnNames.includes(_TMP[2]))
                broker.vpn[vpnName].bridge[bridgeName].remoteVpnNames.push(_TMP[2]);
            while (checkCliExitBlock(lines, ++ln, 6)) {
              _TMP = cleanArr(lines[ln]);
              if (/^      message-spool queue /.test(lines[ln]))
                remoteVpn.queue = _TMP[2];
              else if (/^      (no )?ssl$/.test(lines[ln])) {
                remoteVpn.sslEnabled = (_TMP[0] == "no") ? false : true;
                if (!broker.vpn[vpnName].bridge[bridgeName].remoteVpnSslEnabled.includes(remoteVpn.sslEnabled))
                    broker.vpn[vpnName].bridge[bridgeName].remoteVpnSslEnabled.push(remoteVpn.sslEnabled);
              }
              else if (/^      (no )?shutdown/.test(lines[ln]))
                remoteVpn.enabled = (_TMP[0] == "no") ? true : false;
              else if (_TMP[0] == "connect-order")
                remoteVpn.connectOrder = _TMP[1];
            }
            broker.vpn[vpnName].bridge[bridgeName].remoteVpn.push(remoteVpn);
          } else if (/  (no )?shutdown/.test(lines[ln])) {
            broker.vpn[vpnName].bridge[bridgeName].enabled = (_TMP[0] == "no") ? true : false;
          }
        }
        break;
    }
  }
  updateStatus(ln, lines.length, "currentConfigLinesProcessed");
  if (typeof broker.hostname === 'undefined')
    broker.hostname = broker._routerName;
  return broker;
}
