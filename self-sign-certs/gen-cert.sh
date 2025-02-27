#!/bin/bash

## Generates a new key and certificate for root CA, then generates a new key and certificate for server

export ROOT_PASS="5e_E(Zf9l2f!v4pRx2V%" # export required as openssl command is crafted to use environment variables
ROOT_CN=authority.handy

export PASS= # export required as openssl command is crafted to use environment variables
CN=solace.handy
SAN="DNS:*.handy,DNS:*.local,IP:10.10.10.188, IP:10.10.10.189"
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

if [[ "$1" == "ec*" ]]; then
	echo "Generating Root Certificate and Key..."
	openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -days 3650 -keyout CA.key -out CA.crt -passout env:ROOT_PASS -subj "${RSUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	echo "${ROOT_PASS}" > CA.pass
	
	echo "Generating Server CSR and Key..."
	openssl ecparam -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -passout env:PASS -keyout server.key -out server.csr -subj "${SUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	echo "${PASS}" > server.pass
	
	echo "Generating Server Certificate and Key..."
	openssl x509 -req -in server.csr -CA CA.crt -CAkey CA.key -CAcreateserial -passin env:ROOT_PASS -sha256 -days 365 -out server.crt
else
	echo "Generating Root Certificate and Key..."
	openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -keyout CA.key -out CA.crt -passout env:ROOT_PASS -subj "${RSUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	echo "${ROOT_PASS}" > CA.pass
	
	echo "Generating Server CSR and Key..."
	openssl req -newkey rsa:4096 -passout env:PASS -keyout server.key -out server.csr -subj "${SUBJ}" -addext "subjectAltName=${SAN}" 2> /dev/null
	echo "${PASS}" > server.pass
	
	echo "Generating Server Certificate and Key..."
	openssl x509 -req -in server.csr -CA CA.crt -CAkey CA.key -CAcreateserial -passin env:ROOT_PASS -sha256 -days 365 -out server.crt
fi