#!/bin/bash

REG_URL=http://registry.handy:45000
CATALOG=${REG_URL}/v2/_catalog

if [[ "$1" == "tags" ]]; then
	if [[ "$2" == "" ]]; then
		echo "Missing Repository Name"
		exit
	else
		curl -s "${REG_URL}/v2/$2/tags/list" | jq .tags
	fi
else 
	curl -s "${REG_URL}/v2/_catalog"	| jq .repositories
fi