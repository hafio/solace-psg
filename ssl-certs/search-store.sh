#!/bin/bash

echoUsage() {
	echo "Usage: $0 <trust/key store> <certificate> [certificates] [OPTIONS]
	
	Script searches the trust/key store for certificates by comparing certificate's SHA256 fingerprint.
	
	Repeat [certificates] for multiple search entries.
	
	OPTIONS:
	  --pass <password> : specify the passphrase for the store. Script will prompt for password if not specified."
	exit	
}

_C_GRN="\e[32m"
_C_YEL="\e[33m"
_C_MAG="\e[35m"
_C="\e[0m"

while [[ $# -gt 0 ]]; do
  case "$1" in
    ?)
	  echoUsage
	  ;;
    --pass)
	  PASS="-storepass $2"
      shift 2
      ;;
	*)
	  if [[ -z "${STORE}" ]]; then
		STORE=$1
	  elif [[ ! -f "$1" ]]; then
	    echo "Certificate '$1' not found."
		exit 1
	  else
		CERTS+=("$1")
	  fi
	  shift
	  ;;
  esac
done
if [[ -z "${STORE}" ]]; then
	echo "Please specify a trust/key store file."
	exit 1
elif [[ ${#CERTS[@]} -eq 0 ]]; then
	echo "Please specify at least one certificate."
	exit 1
fi

echo "Performing search in '${STORE}'..."
keytool -list -keystore "${STORE}" ${PASS} > .keystore-entries

for cert in "${CERTS[@]}"; do
	# retrieve certificate fingerprint
	CFP=`openssl x509 -in "${cert}" -noout -fingerprint -sha256 | cut -d"=" -f2`
	# get all matches and preceeding line
	grep "${CFP}" .keystore-entries -B 1 > .keystore-matches
	MATCH_CNT=`cat .keystore-matches | grep Entry | wc -l`
	KEY_MATCH_CNT=`cat .keystore-matches | grep PrivateKeyEntry | wc -l`
	[[ ${KEY_MATCH_CNT} -eq 0 ]] && KEY_MATCH_FIRST="" || KEY_MATCH_FIRST="\n\tFirst Matching Key Alias: ${_C_MAG}`cat .keystore-matches | grep PrivateKeyEntry | head -1 | cut -d"," -f1`${_C}."
	CERT_MATCH_CNT=`cat .keystore-matches | grep trustedCertEntry | wc -l`
	[[ ${CERT_MATCH_CNT} -eq 0 ]] && CERT_MATCH_FIRST="" || CERT_MATCH_FIRST="\n\tFirst Matching Certificate Alias: ${_C_MAG}`cat .keystore-matches | grep trustedCertEntry | head -1 | cut -d"," -f1`${_C}."
	echo -n "Certificate "
	[[ ${MATCH_CNT} -eq 0 ]] && echo -e "${cert}: ${_C_YEL}Not found${_C}." || echo -e "${cert}: ${_C_GRN}Found${_C}.\n\t${KEY_MATCH_CNT} keys + ${CERT_MATCH_CNT} certs = ${MATCH_CNT} total" ${KEY_MATCH_FIRST} ${CERT_MATCH_FIRST}
done

rm -f .keystore-entries .keystore-matches