#!/bin/bash

showHelp() {
  echo "Usage: $0 [OPTIONS]

Helper script to download files from https://products.solace.com via curl and wget (both are required).
If the options are not provided, the script will prompt for the values.

OPTIONS:
  --user <username>: specify the portal login username.
  --pass <password>: specify the portal login password.
  --path <path>: specify the full filepath of the file to be downloaded (everything after https://products.solace.com/)
  --cookie <cookie>: specify the previous cookie to be reused.
                     If this option is specified, <user> and <pass> will be ignored.
  "
  exit 1
}

esc() {
    local input="$1"
    # Escape the input safely for shell usage
    printf '%q' "$input"
}

while [[ $# -gt 0 ]]; do
	case "$1" in
    --cookie)
      COOKIE="$2"
      shift 2
      ;;
		--user)
			USER="$2"
			shift 2
			;;
    --pass)
      PASS="$2"
      shift 2
      ;;
    --path)
      FPATH="$2"
      shift 2
      ;;
    -h|--help|?)
      showHelp
      shift 1
      ;;
	esac
done

URL="https://products.solace.com"

if [[ -z "${COOKIE}" ]]; then
  if [[ -z "${USER}" ]]; then
    echo -n "Enter Solace Products Login Username: "
    read USER
  fi

  if [[ -z "${PASS}" ]]; then
    echo -n "Enter Solace Products Login Password: "
    read -s PASS
    echo 
  fi

  if [[ -z "${FPATH}" ]]; then
    echo -n "Enter path (e.g. products/10.25-LTS/PubSub_Stand/Archive/10.25.0.55/solace-pubsub-standard-10.25.0.55-docker.tar.gz): "
    read FPATH
  fi

  COOKIE=`curl -s -X POST -i ${URL} -H "Content-Type: application/x-www-form-urlencoded" -d "login-submit=login&username=$(esc "${USER}")&password=$(esc "${PASS}")" | grep Set-Cookie`

  COOKIE=${COOKIE#*:}
  COOKIE=${COOKIE%;*}
  
  echo "Cookie: ${COOKIE}"
fi

LOGGEDIN=`curl -s ${URL} -b "${COOKIE}" | grep logout-submit | wc -l`

if [[ ${LOGGEDIN} -eq 1 ]]; then
  curl -s -X POST ${URL} -H "Cookie: ${COOKIE}" -H "Content-Type: application/x-www-form-urlencoded" -d "license-submit=license&acceptcheckbox=checked&submit=submit"
  wget --header="Cookie: ${COOKIE}" "${URL}/${FPATH}"
else
  echo "[Error] Incorrect credentials!"
  exit 1
fi