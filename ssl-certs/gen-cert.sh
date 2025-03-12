#!/bin/bash

## Generates a new key and certificate for root CA, then generates a new key and certificate for server

ROOT_CN="CA Authority"
ROOT_CTRY=SG
ROOT_ST=
ROOT_LOC="Singapore"
ROOT_ORG="Solace"
ROOT_ORG_UNIT="IT"
ROOT_EMAIL=
ROOT_SAN="DNS:authority.handy,DNS:*.hamaster.handy,DNS:*.hasol.handy"

SVR_CN="Hamaster"
SVR_CTRY=SG
SVR_ST=
SVR_LOC="Handy Road"
SVR_ORG="HAFIO"
SVR_ORG_UNIT="Home"
SVR_EMAIL="home@hafio.tv"
SVR_SAN="DNS:hamaster.handy,DNS:*.hamaster.handy,DNS:*.hasol.handy"

########################################################################################
############################## CHANGE CONFIG VALUES ABOVE ##############################
########################################################################################

echoUsage() {
	echo "Usage: gen-cert.sh [OPTIONS]
	
    This script will generate certificate (.crt), key (.crt), and password (.pass) for both CA and server, and certificate signing request (.csr) for server.
	
	Password file will not be generated if password is empty.
	
	Script utillizes only RSA algorithm.
	
	Documentation: https://github.com/hafio/solace-psg/tree/main/ssl-certs
	
  Options:
    --root-cert-name <name> : Root certificate output filename prefix.
    --root-cert-prefix <prefix> : Root certificate input filename prefix. This option will skip root certificate creation.
    --root-pass <pass> : Password to be used for root certificate key.
    --server-cert-name <prefix> : Server certificate output filename prefix.
    --server-pass <pass> : Password to be used for server certificate key."
	exit 1
}
concatCnIfNotBlank() {
	[[ -n "$2" ]] && echo "/$1=$2"
}
passwordOrBlank() {
	[[ -n "${!1}" ]] && echo "-passout env:$1" || echo "-nodes"
}
checkExit() {
	if [[ $1 -ne 0 ]] || [[ ! -f "$2" ]]; then
		echo "Failed"
		exit 1
	else
		echo "Ok : $2"
	fi
}

ALGO="rsa:4096" # use 4096 and above as 2048 will not be acceptable beyond 2030
ROOT_DAYS=3650
SVR_DAYS=365
USE_EC=false
GEN_ROOT=1
export ROOT_PASS=""
export SVR_PASS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
	--root-cert-name)
	  if [[ -z "$2" ]]; then
		echo "$1: Missing filename prefix"
		exit 1
	  fi
	  if [[ ${GEN_ROOT} -eq 0 ]]; then
		echo "--root-cert-name cannot be specified together with --root-cert-prefix"
		exit 1
	  fi
	  ROOT_FILE_PREFIX="$2"
	  
	  shift 2
	  ;;
    --root-cert-prefix)
	  if [[ -z "$2" ]]; then
		echo "$1: Missing filename prefix"
		exit 1
	  fi
	  if [[ -n "${ROOT_FILE_PREFIX}" ]]; then
		echo "--root-cert-prefix cannot be specified together with --root-cert-name"
		exit 1
	  fi
	  if [[ "$2" == "server" ]] || [[ "${SVR_FILE_PREFIX}" == "$2" ]]; then
		echo "--root-cert-prefix cannot be 'server' or the same as --server-cert-name"
		exit 1
	  fi
	  GEN_ROOT=0
      ROOT_FILE_PREFIX="$2"
      shift 2
      ;;
	--server-cert-name)
	  if [[ -z "$2" ]]; then
		echo "$1: Missing filename prefix"
		exit 1
	  fi
	  if [[ "$2" == "CA" ]] || [[ "$2" == "${ROOT_FILE_PREFIX}" ]]; then
		echo "--server-cert-name cannot be 'CA' or the same as --root-cert-name"
		exit 1
	  fi
	  SVR_FILE_PREFIX="$2"
	  shift 2
	  ;;
    --root-pass)
	  if [[ -z "$2" ]]; then
		echo "$1: Missing password"
		exit 1
	  fi
      ROOT_PASS="$2"
      shift 2
      ;;
    --server-pass)
	  if [[ -z "$2" ]]; then
		echo "$1: Missing password"
		exit 1
	  fi
      SVR_PASS="$2"
      shift 2
      ;;
    *)
      echoUsage
      ;;
  esac
done

ROOT_FILE_PREFIX=${ROOT_FILE_PREFIX:-CA}
SVR_FILE_PREFIX=${SVR_FILE_PREFIX:-server}
PARM_ROOT_PASS=`passwordOrBlank ROOT_PASS`
PARM_SVR_PASS=`passwordOrBlank SVR_PASS`

RCN=`concatCnIfNotBlank CN "${ROOT_CN}"`
RCTRY=`concatCnIfNotBlank C "${ROOT_CTRY}"`
RST=`concatCnIfNotBlank ST "${ROOT_ST}"`
RLOC=`concatCnIfNotBlank L "${ROOT_LOC}"`
RORG=`concatCnIfNotBlank O "${ROOT_ORG}"`
RORG_UNIT=`concatCnIfNotBlank OU "${ROOT_ORG_UNIT}"`
REMAIL=`concatCnIfNotBlank emailAddress "${ROOT_EMAIL}"`
RSUBJ="${RCN}${RCTRY}${RST}${RLOC}${RORG}${RORG_UNIT}${REMAIL}"

SCN=`concatCnIfNotBlank CN "${SVR_CN}"`
SCTRY=`concatCnIfNotBlank C "${SVR_CTRY}"`
SST=`concatCnIfNotBlank ST "${SVR_ST}"`
SLOC=`concatCnIfNotBlank L "${SVR_LOC}"`
SORG=`concatCnIfNotBlank O "${SVR_ORG}"`
SORG_UNIT=`concatCnIfNotBlank OU "${SVR_ORG_UNIT}"`
SEMAIL=`concatCnIfNotBlank emailAddress "${SVR_EMAIL}"`
SSUBJ="${SCN}${SCTRY}${SST}${SLOC}${SORG}${SORG_UNIT}${SEMAIL}"

if ${USE_EC}; then
	echo "Not implemented"
	exit 1

else
	if [[ ${GEN_ROOT} -ne 0 ]]; then
		echo -n "Generating Root Certificate and Key..."
		openssl req -x509 -newkey ${ALGO} -sha256 -days ${ROOT_DAYS} -keyout ${ROOT_FILE_PREFIX}.key -out ${ROOT_FILE_PREFIX}.crt ${PARM_ROOT_PASS} -subj "${RSUBJ}" -addext "subjectAltName=${ROOT_SAN}" -addext "basicConstraints=critical,CA:TRUE,pathlen:1" -addext "keyUsage=critical,keyCertSign,cRLSign,digitalSignature" 2> /dev/null
		checkExit $? ${ROOT_FILE_PREFIX}.crt
		[[ -n ${ROOT_PASS} ]] && echo "${ROOT_PASS}" > ${ROOT_FILE_PREFIX}.pass
	fi
	
	if [[ -f "${ROOT_FILE_PREFIX}".crt ]] && [[ -f "${ROOT_FILE_PREFIX}.key" ]]; then
		echo -n "Generating Server CSR and Key..."
		openssl req -newkey ${ALGO} ${PARM_SVR_PASS} -keyout ${SVR_FILE_PREFIX}.key -out ${SVR_FILE_PREFIX}.csr -subj "${SSUBJ}" -addext "subjectAltName=${SVR_SAN}" -addext "basicConstraints=critical,CA:FALSE" -addext "keyUsage=critical,digitalSignature,keyEncipherment,dataEncipherment" -addext "extendedKeyUsage=critical,serverAuth" 2> /dev/null
		checkExit $? ${SVR_FILE_PREFIX}.csr
		[[ -n ${SVR_PASS} ]] && echo "${SVR_PASS}" > ${SVR_FILE_PREFIX}.pass
		
		echo -n "Generating Server Certificate..."
		openssl x509 -req -in ${SVR_FILE_PREFIX}.csr -CA ${ROOT_FILE_PREFIX}.crt -CAkey ${ROOT_FILE_PREFIX}.key -CAcreateserial -passin env:ROOT_PASS -sha256 -days ${SVR_DAYS} -copy_extensions copy -out ${SVR_FILE_PREFIX}.crt 2> /dev/null
		checkExit $? ${SVR_FILE_PREFIX}.crt
		openssl x509 -noout -in ${SVR_FILE_PREFIX}.crt -issuer -subject -ext subjectAltName
	else
		echo "Root file(s) (${ROOT_FILE_PREFIX}.crt and/or ${ROOT_FILE_PREFIX}.key) is/are missing"
		exit 1
	fi
fi