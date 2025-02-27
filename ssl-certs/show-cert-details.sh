#!/bin/bash

if [[ -z "$1" ]]; then
	echo "Usage: $0 [certificate]"
	exit
elif [[ ! -f "$1" ]] || [[ -d "$1" ]]; then
	echo "Certificate file '$1' not found"
	exit
fi

openssl x509 -inform pem -noout -text -in "$1" 2> /dev/null
if [[ $? -eq 0 ]]; then
	openssl x509 -inform pem -noout -text -in "$1"
else
	openssl x509 -inform der -noout -text -in "$1"
fi