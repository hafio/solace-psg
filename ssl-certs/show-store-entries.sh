#!/bin/bash

echoUsage() {
	echo "Usage: $0 <store> [pass]
	
	Does a simple keytool -list.
	
	if [pass] is not provided, script will prompt for store passphrase."
	exit
}
for in in "$@"; do
	if [[ "${in:0:1}" == "?" ]]; then
		echoUsage
	fi
done
if [[ -z "$1" ]]; then
	echoUsage
elif [[ ! -f "$1" ]]; then
	echo "$1 does not exist"
	exit
elif [[ -n "$2" ]]; then
	PASS="-storepass $2"
fi

keytool -list -keystore $1 ${PASS}