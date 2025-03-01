#!/bin/bash

## Generates a new key and certificate for root CA, then generates a new key and certificate for server

export ROOT_PASS= # export required as openssl command is crafted to use environment variables
ROOT_CN=authority.handy

export PASS= # export required as openssl command is crafted to use environment variables
CN=solace.handy
export SAN="DNS:*.handy,DNS:*.local,IP:10.10.10.188,IP:10.10.10.189" # export required as openssl command is crafted to use environment variables
CTRY=SG
ST=
LOC="Handy Road"
ORG=Solace
ORG_UNIT="Professional Services"
EMAIL="hamlyn.yew@solace.com"

############# CHANGE VALUES ABOVE ##################

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

echo '[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = $ENV::SAN' > server.conf

if [[ "$1" == "ec*" ]]; then
	echo -n "Generating Root Certificate and Key..."
	openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -days 3650 -keyout CA.key -out CA.crt ${PARM_ROOT_PASS} -subj "${RSUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	checkExit $?
	echo "${ROOT_PASS}" > CA.pass
	
	echo -n "Generating Server CSR and Key..."
	openssl ecparam -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 ${PARM_PASS} -keyout server.key -out server.csr -subj "${SUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	checkExit $?
	echo "${PASS}" > server.pass
	
	echo -n "Generating Server Certificate and Key..."
	openssl x509 -req -in server.csr -CA CA.crt -CAkey CA.key -CAcreateserial -passin env:ROOT_PASS -sha256 -days 365 -out server.crt -extfile server.conf -extensions v3_req
	checkExit $?

else
	echo -n "Generating Root Certificate and Key..."
	openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -keyout CA.key -out CA.crt ${PARM_ROOT_PASS} -subj "${RSUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	checkExit $?
	echo "${ROOT_PASS}" > CA.pass
	
	echo -n "Generating Server CSR and Key..."
	openssl req -newkey rsa:4096 ${PARM_PASS} -keyout server.key -out server.csr -subj "${SUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	checkExit $?
	echo "${PASS}" > server.pass
	
	echo -n "Generating Server Certificate..."
	openssl x509 -req -in server.csr -CA CA.crt -CAkey CA.key -CAcreateserial -passin env:ROOT_PASS -sha256 -days 365 -out server.crt -extfile server.conf -extensions v3_req
	checkExit $?
	
fi