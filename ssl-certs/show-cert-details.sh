#!/bin/bash

if [[ -z "$1" ]]; then
	echo "Usage: $0 <file>"
	exit
elif [[ ! -f "$1" ]] || [[ -d "$1" ]]; then
	echo "File '$1' not found"
	exit
fi

openssl x509 -inform pem -noout -text -in "$1" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
	echo -n "PEM "
	openssl x509 -inform pem -noout -text -in "$1"
	exit
fi

openssl x509 -inform der -noout -text -in "$1" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
	echo -n "DER "
	openssl x509 -inform der -noout -text -in "$1"
	exit
fi

openssl req -text -in "$1" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
	openssl req -text -in "$1"
	exit
fi

echo "Unable to determine input file $1"