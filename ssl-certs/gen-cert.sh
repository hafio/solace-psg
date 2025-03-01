#!/bin/bash

## Generates a new key and certificate for root CA, then generates a new key and certificate for server

ROOT_CN=authority.handy
CN=hamaster.handy
export SAN="DNS:*.handy,DNS:*.local,IP:10.10.10.188,IP:10.10.10.189" # export required as openssl command is crafted to use environment variables
CTRY=SG
ST=
LOC="Handy Road"
ORG=Solace
ORG_UNIT="Professional Services"
EMAIL="hamlyn.yew@solace.com"

############# CHANGE VALUES ABOVE ##################

echoUsage() {
	echo "Usage: gen-cert.sh [ecc] [OPTIONS]
	[ecc] : if this is specified, certificated will be generated with Elliptical Curve Cryptography (ECC) instead of RSA.
  Options:
    --root-cert-prefix [prefix] : Script will append prefix with '.crt' and '.key' for '-CA' and '-CAkey' used to sign server certificate. Value cannot be 'server'.
    --root-pass [pass] : Password to be used for root certificate key. Leave out parameter to not use any password.
    --server-pass [pass] : Password to be used for server certificate key. Leave out parameter to not use any password."
	exit
}
concatIfNotBlank() {
	if [[ -n "$2" ]]; then
		echo "/$1=$2"
	fi
}
passwordOrBlank() {
	if [[ -n "${!1}" ]]; then
		echo "-passout env:$1"
	else
		echo "-nodes"
	fi
}
checkExit() {
	if [[ $1 -ne 0 ]]; then
		echo "Failed"
		exit
	else
		echo "Ok"
	fi
}
USE_EC=false
ROOT_CERT_PREFIX=""
export ROOT_PASS=""
export SERVER_PASS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    ec*)
      USE_EC=true
      shift
      ;;
    --root-cert-prefix)
      ROOT_CERT_PREFIX="$2"
	  if [[ "${ROOT_CERT_PREFIX}" == "server" ]]; then
		echo "Root Certificate Prefix cannot be server"
		exit
	  fi
      shift 2
      ;;
    --root-pass)
      export ROOT_PASS="$2"
      shift 2
      ;;
    --server-pass)
      export SERVER_PASS="$2"
      shift 2
      ;;
    *)
      echoUsage
      ;;
  esac
done

ROOT_CERT=${ROOT_CERT_PREFIX:-CA}.crt
ROOT_KEY=${ROOT_CERT_PREFIX:-CA}.key
PARM_ROOT_PASS=`passwordOrBlank ROOT_PASS`
PARM_PASS=`passwordOrBlank PASS`

ROOT_CN=`concatIfNotBlank CN "${ROOT_CN}"`
CN=`concatIfNotBlank CN "${CN}"`
CTRY=`concatIfNotBlank C "${CTRY}"`
ST=`concatIfNotBlank ST "${ST}"`
LOC=`concatIfNotBlank L "${LOC}"`
ORG=`concatIfNotBlank O "${ORG}"`
ORG_UNIT=`concatIfNotBlank OU "${ORG_UNIT}"`
EMAIL=`concatIfNotBlank emailAddress "${EMAIL}"`
SUBJ="${CN}${CTRY}${ST}${LOC}${ORG}${ORG_UNIT}${EMAIL}"
RSUBJ="${ROOT_CN}${CTRY}${ST}${LOC}${ORG}${ORG_UNIT}${EMAIL}"

echo 'keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = $ENV::SAN' > server.conf

if ${USE_EC}; then
	echo "Not implemented"
	exit 1

else
	echo -n "Generating Root Certificate and Key..."
	openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -keyout ${ROOT_KEY} -out ${ROOT_CERT} ${PARM_ROOT_PASS} -subj "${RSUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	checkExit $?
	echo "${ROOT_PASS}" > ${ROOT_CERT_PREFIX:-CA}.pass
	
	echo -n "Generating Server CSR and Key..."
	openssl req -newkey rsa:4096 ${PARM_PASS} -keyout server.key -out server.csr -subj "${SUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	checkExit $?
	echo "${PASS}" > server.pass
	
	echo -n "Generating Server Certificate..."
	openssl x509 -req -in server.csr -CA ${ROOT_CERT} -CAkey ${ROOT_KEY} -CAcreateserial -passin env:ROOT_PASS -sha256 -days 365 -out server.crt -extfile server.conf
	checkExit $?
	
fi
