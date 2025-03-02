#!/bin/bash

if [[ -z "$2" ]]; then
	echo "Usage: $0 <server certificate> <root certificate> [intermediate certificate]"
	exit
fi
out=""
if [[ ! -f "$1" ]]; then
	out+="Certificate file $1 not found"
fi
if [[ ! -f "$2" ]]; then
	[[ -n "${out}" ]] && out+="\n"
	out+="Root file $2 not found"
fi
if [[ -n "$3" ]] && [[ -f "$3" ]]; then
	out+="Intermediate file $3 not found"
fi
if [[ -z "$out" ]]; then
	openssl verify -CAfile <(cat $2 $3) "$1"
else
	echo -e ${out}
fi