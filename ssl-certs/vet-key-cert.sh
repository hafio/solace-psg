#!/bin/bash

if [[ -z "$2" ]]; then
	echo "Usage: $0 <server certificate> <server key>"
	exit
fi
out=""
if [[ ! -f "$1" ]]; then
	out+="Certificate file $1 not found"
fi
if [[ ! -f "$2" ]]; then
	[[ -n "${out}" ]] && out+="\n"
	out+="Server Key $2 not found"
fi
if [[ -z "$out" ]]; then
	openssl rsa -check -noout -in $2
	if [[ $? -eq 0 ]]; then
		mod_key=`openssl rsa -modulus -noout -in $2 | openssl sha256`
		mod_crt=`openssl x509 -modulus -noout -in $1 | openssl sha256`
		if [[ "${mod_key}" == "${mod_crt}" ]]; then
			echo "[OK] Server Certificate and Private Key matches"
			echo "SHA256: ${mod_key#*= }"
		else
			echo "[ERROR] Server Certificate and Private Key does not match."
			echo "Certificate SHA256: ${mod_crt#*= }"
			echo "Private Key SHA256: ${mod_key#*= }"
			exit 1
		fi
	fi
else
	echo -e ${out}
fi
