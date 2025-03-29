#!/bin/bash

echoUsage() {
	echo "Usage: $0 [OPTIONS] <file>
	
	Display certificate details.
	
	OPTIONS:
	  --fingerprint : Display SHA1 & SHA256 fingerprint of certificates"
	exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
	--fingerprint)
	  FINGERPRINT="true"
	  shift
	  ;;
	
	--*|?)
	  echoUsage
	  ;;

    *)
      if [[ -n ${CERT} ]]; then
		echo "Only accepts 1 positional parameter."
		exit 1
	  elif [[ ! -f "$1" ]] || [[ -d "$1" ]]; then
	    echo "File $1 not found."
		exit 1
	  else
		CERT="$1"
	  fi
	  shift
      ;;
  esac
done

openssl x509 -inform pem -noout -text -in "${CERT}" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
	echo -n "PEM "
	[[ -z "${FINGERPRINT}" ]] && openssl x509 -inform pem -noout -text -in "${CERT}" || (
		echo -n "Certificate "
		openssl x509 -in "${CERT}" -noout -fingerprint -sha1
		echo -n "PEM Certificate "
		openssl x509 -in "${CERT}" -noout -fingerprint -sha256
	)
	exit
fi

openssl x509 -inform der -noout -text -in "${CERT}" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
	echo -n "DER "
	[[ -z "${FINGERPRINT}" ]] && openssl x509 -inform der -noout -text -in "${CERT}" || (
		echo -n "Certificate "
		openssl x509 -in "${CERT}" -noout -fingerprint -sha1
		echo -n "DER Certificate "
		openssl x509 -in "${CERT}" -noout -fingerprint -sha256
	)
	exit
fi

openssl req -text -in "${CERT}" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
	[[ -z "${FINGERPRINT}" ]] && openssl req -text -in "${CERT}" || (
		echo "Error: Fingerprint is not applicable for Certificate Signing Request (CSR) files"
	)
	exit
fi

echo "Unable to determine input file ${CERT}"
exit 1