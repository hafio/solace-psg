#!/bin/bash

echoUsage() {
	echo "Usage: gen-store.sh <PARAMETERS> [OPTIONS] [Store]
	
	This script will import the keys/certificates into [Store] or generate a new store if it doesn't exist.
	
	Documentation: https://github.com/hafio/solace-psg/tree/main/ssl-certs
	
	Parameters (mandatory fields):
	  --cert <filename> : Server/Client certificate to be stored. Repeat for multiple entries.
  
	Options:
	  [Store] : Store output filename. Either specify this option or [Store], not both.
	  --out <filename> : Store output filename. Either specify this option or [Store], not both.
	  --key <filename> : Private key used to generate certificates. Key store will be created if this is specified.  Repeat for multiple entries.
	  --keypass <password> : Password used to generate private key.
	  --cert-chain <filename> : Certificate Authority root certificate used to sign <cert>. Repeat for intermediate certificate if required. Should only be used in conjunction with --key.
	  --pass <password> : Store password. If not specified, script will prompt for one."
	exit 1
}
checkStoreEntryAlias() {
	EXITCODE=0
	while [[ ${EXITCODE} -eq 0 ]]; do
		((ENTRY++))
		keytool -keystore ${STORE} -storepass ${PASS} -list -alias $1_${ENTRY} 2>&1 > /dev/null
		EXITCODE=$?
	done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cert)
	  if [[ ! -f "$2" ]]; then
		echo "$1: Missing file $2"
		exit 1
	  fi
	  CERTS+=("$2")
      shift 2
      ;;
	--key)
	  if [[ ! -f "$2" ]]; then
		echo "$1: Missing file $2"
		exit 1
	  fi
	  KEYS+=("$2")
	  shift 2
	  ;;
	--keypass)
	  KEYPASSES+=("$2")
	  shift 2
	  ;;
	--cert-chain)
	  if [[ ! -f "$2" ]]; then
		echo "$1: Missing file $2"
		exit 1
	  fi
	  CHAIN="${CHAIN} --certfile $2"
	  shift 2
	  ;;
    --out)
	  if [[ -n "${STORE}" ]]; then 
		echo "Please only specify either [Store] or --out"
		exit 1
	  fi
	  if [[ -z "$2" ]] || [[ "$2" == --* ]]; then
		echo "$1: Missing or invalid filename"
		exit 1
	  fi
	  [[ ! -f "$2" ]] && NEW_STORE=1
      STORE="$2"
      shift 2
      ;;
	--pass)
	  PASS="$2"
	  shift 2
	  ;;
    --*|?|-h)
      echoUsage
      ;;
	*)
	  if [[ -n "${PARM_POS}" ]]; then
		echo "Please only specify 1 positional parameter"
		exit 1
	  elif [[ -n "${STORE}" ]]; then
		echo "Please only specify either [Store] or --out"
		exit 1
	  else
	    [[ ! -f "$1" ]] && NEW_STORE=1
		STORE="$1"
		PARM_POS=1
		shift
	  fi
	  ;;
  esac
done
if [[ -z "${STORE}" ]]; then
	echo "Please specify [Store] or --out"
	exit 1
fi
if [[ ${#CERTS[@]} -eq 0 ]]; then
	echo "Certificates are missing."
	exit 1
fi
if [[ -z "${PASS}" ]]; then
	echo -n "Please enter the store password: "
	read -es PASS
	echo ""
fi
[[ -n ${NEW_STORE} ]] && echo "Creating new keystore: ${STORE}" || echo "Using existing keystore: ${STORE}"
if [[ ${#KEYS[@]} -eq 0 ]]; then
	ALIAS="cert_entry"
	ENTRY=0
	for cert in "${CERTS[@]}"; do
		# Loop until keystore alias is not in used
		checkStoreEntryAlias ${ALIAS}
		# Retrieve certificate fingerprint
		CFP=`openssl x509 -in "${cert}" -noout -fingerprint -sha256 | cut -d"=" -f2`
		# Check for duplicate entries by matching certificate fingerprint across Trusted Certificate and Private Key Entries
		[[ `keytool -list -keystore "${STORE}" -storepass "${PASS}" | grep "${CFP}" | wc -l` -eq 0 ]] && NP="--noprompt" || NP=""
		keytool -importcert -file "${cert}" -storetype PKCS12 -keystore "${STORE}" -storepass "${PASS}" -alias "${ALIAS}_${ENTRY}" ${NP}
	done
elif [[ ${#KEYS[@]} -ne ${#CERTS[@]} ]]; then
	echo "Error: ${#KEY[@]} keys specified against ${#CERT[@]} certificates."
	echo "Please make sure the number of keys and certificates specified are the same and in the same order"
	exit 1
elif [[ ${#KEYS[@]} -ne ${#KEYPASSES[@]} ]] && [[ ${#KEYPASSES[@]} -ne 0 ]]; then
	echo "Error: ${#KEY[@]} keys specified against ${#KEYPASSES[@]} key's passwords."
	echo "Please make sure the number of keys and keys' passwords specified are the same and in the same order, or do not specify any keys' password."
	exit 1
else
	ALIAS="key_entry"
	ENTRY=0
	for i in "${!CERTS[@]}"; do
		# Loop until keystore alias is not in used
		checkStoreEntryAlias ${ALIAS}
		# Retrieve certificate fingerprint
		CFP=`openssl x509 -in "${CERTS[i]}" -noout -fingerprint -sha256 | cut -d"=" -f2`
		# Check for duplicate entries by matching certificate fingerprint across Private Key Entries only
		ENT=`keytool -list -keystore "${STORE}" -storepass "${PASS}" | grep "${CFP}" -B 1`
		ENT_IS_KEY=`echo ${ENT} | grep PrivateKeyEntry | wc -l`
		if [[ ${ENT_IS_KEY} -ne 0 ]]; then
			ENT_NAME=`echo ${ENT} | grep PrivateKeyEntry | head -1`
			echo -n "Certificate already exists in keystore under= alias <${ENT_NAME%%,*}>
Do you still want to add it? [no]: "
			read -e -n 1 PROCEED
		fi
		if [[ ${ENT_IS_KEY} -eq 0 ]] || [[ "${PROCEED,,}" == "y" ]]; then
			# Convert Certificate + Private Key into PKCS12 Keystore format (temporary keystore .tmp)
			[[ -n "${KEYPASSES[i]}" ]] && KEYPASS_PARM="-passin pass:${KEYPASSES[i]}" || KEYPASS_PARM=""
			openssl pkcs12 -export -inkey "${KEYS[i]}" -in "${CERTS[i]}" ${KEYPASS_PARM} ${CHAIN} -out .temp-keystore -passout pass:"${PASS}"
			# Import .temp-keystore keystore in ${STORE}
			keytool -importkeystore -srckeystore .temp-keystore -srcstorepass "${PASS}" -destkeystore "${STORE}" -deststorepass "${PASS}" -srcalias 1 -destalias "${ALIAS}_${ENTRY}" --noprompt
			EXITCODE=$?
			[[ ${EXITCODE} -eq 0 ]] && echo "Imported successful." || echo "Error detected while importing ${CERTS[i]} + ${KEYS[i]}"
			rm -f .temp-keystore
		fi
	done
fi