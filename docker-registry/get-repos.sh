#!/bin/bash

REG_URL=https://registry.hamaster.handy:45443

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tags)
      SHOW_TAGS=true
	  [[ -z "$2" ]] && echoUsage || REPO="$2"
      shift 2
      ;;
    --CA-cert)
      PARM_CA="--cacert $2"
      shift 2
      ;;
    --url)
      REG_URL="$2"
      shift 2
      ;;
    *)
      echoUsage
      ;;
  esac
done

echoUsage() {
	echo "Usage: $0 [OPTIONS]"
	echo 'OPTIONS:
	--tags <repo> : list available tags of Repository
	--CA-cert <file> : specify CA certificate file to use for registries using non-public CAs
	--url <url> : specify registry url to connect to instead of using configured url'
	exit
}



[[ "${SHOW_TAGS}" == "true" ]] && (curl ${PARM_CA} -s "${REG_URL}/v2/${REPO}/tags/list" | jq .tags) || (curl ${PARM_CA} -s "${REG_URL}/v2/_catalog"	| jq .repositories)