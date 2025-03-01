#!/bin/bash

if [[ -z "$2" ]]; then
	echo "Usage: $0 <server certificate> <root certificate> [intermediate certificate]"
	exit
fi

openssl verify -CAfile <(cat $2 $3) "$1"