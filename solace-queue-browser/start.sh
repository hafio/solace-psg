#!/bin/bash

CONF="/etc/lighttpd/httpd.conf"
CERT="/certs/server.pem"

if [[ -n "${HTTPD_CONF}" ]]; then
	[[ "${HTTPD_CONF}" != "${CONF}" ]] && cp ${HTTPD_CONF} ${CONF}
else
	if [[ -f "${CERT}" ]] && [[ -r "${CERT}" ]]; then
		echo "Starting lighttpd with ssl..."
		echo 'server.modules = ( "mod_access", "mod_alias", "mod_cgi", "mod_openssl" )

server.document-root = "/www"
server.port = 8443
server.bind = "0.0.0.0"

ssl.engine = "enable"
ssl.pemfile = "/certs/server.pem"

cgi.assign = ( ".sh" => "/bin/bash" )

server.indexfiles = ( "index.html" )' > ${CONF}
	else
		echo "${CERT} does not exist or is unreadable."
		echo "Starting lighttpd without ssl..."
		echo 'server.modules = ( "mod_access", "mod_alias", "mod_cgi", "mod_openssl" )

server.document-root = "/www"
server.port = 8443
server.bind = "0.0.0.0"

cgi.assign = ( ".sh" => "/bin/bash" )

server.indexfiles = ( "index.html" )' > ${CONF}
	fi
fi

lighttpd -D -f ${CONF}