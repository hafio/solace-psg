#!/bin/bash

# =============================================================================
# gen-store.sh
# -----------------------------------------------------------------------------
# Imports certificates / keys into a Java keystore (or creates a new one).
#
# High-level flow:
#   1. Helper functions (usage text + alias collision check)
#   2. Argument parsing loop  ..... reads flags & the positional [Store] arg
#   3. Post-parse validation  ..... confirms mandatory inputs are present
#   4. Import mode selection  ..... branches on whether --key was supplied:
#        - No keys  -> import certs as TRUSTED CERTIFICATE entries
#        - Keys      -> import cert+key pairs as PRIVATE KEY entries
# =============================================================================


# -----------------------------------------------------------------------------
# FUNCTION: echoUsage
# Prints help text and exits. Called for -h, unknown flags, or bad input.
# -----------------------------------------------------------------------------
echoUsage() {
	echo "Usage: gen-store.sh <PARAMETERS> [OPTIONS] [Store]
	
	This script will import the keys/certificates into [Store] or generate a new store if it doesn't exist.
	
	Documentation: https://github.com/hafio/solace-psg/tree/main/ssl-certs
	
	Parameters (mandatory fields):
	  --cert <filename> : Server/Client certificate to be stored. Repeat for multiple entries.
  
	Options:
	  [Store] : Store output filename. Either specify this option or [Store], not both.
	  --out <filename> : Store output filename. Either specify this option or [Store], not both.
	  --key <filename> : Private key used to generate certificates. Key store will be created if this is specified.  Repeat for multiple entries.
	  --keypass <password> : Password used to generate private key.
	  --cert-chain <filename> : Certificate Authority root certificate used to sign <cert>. Repeat for intermediate certificate if required. Should only be used in conjunction with --key.
	  --pass <password> : Store password. If not specified, script will prompt for one."
	exit 1
}

# -----------------------------------------------------------------------------
# FUNCTION: checkStoreEntryAlias
# Given an alias prefix ($1), increments $ENTRY until "<prefix>_<ENTRY>" is a
# free alias in the keystore (keytool -list fails => alias not in use).
# Used so repeated imports don't clobber existing aliases.
# -----------------------------------------------------------------------------
checkStoreEntryAlias() {
	EXITCODE=0
	while [[ ${EXITCODE} -eq 0 ]]; do
		((ENTRY++))
		keytool -keystore ${STORE} -storepass ${PASS} -list -alias $1_${ENTRY} 2>&1 > /dev/null
		EXITCODE=$?
	done
}


# =============================================================================
# SECTION 1: ARGUMENT PARSING
# Walk every CLI arg. Flags accumulate into arrays (CERTS/KEYS/KEYPASSES) or
# scalars (STORE/PASS/CHAIN); the lone non-flag arg becomes the positional
# [Store]. File-existence checks happen inline as each path is read.
# =============================================================================
while [[ $# -gt 0 ]]; do
  case "$1" in
    # --- --cert: certificate file (repeatable) ---
    --cert)
	  if [[ ! -f "$2" ]]; then
		echo "$1: Missing file $2"
		exit 1
	  fi
	  CERTS+=("$2")
      shift 2
      ;;
	# --- --key: private key file (repeatable); triggers key-store mode ---
	--key)
	  if [[ ! -f "$2" ]]; then
		echo "$1: Missing file $2"
		exit 1
	  fi
	  KEYS+=("$2")
	  shift 2
	  ;;
	# --- --keypass: password for the matching --key (repeatable) ---
	--keypass)
	  KEYPASSES+=("$2")
	  shift 2
	  ;;
	# --- --cert-chain: CA/intermediate cert appended to the PKCS12 chain ---
	--cert-chain)
	  if [[ ! -f "$2" ]]; then
		echo "$1: Missing file $2"
		exit 1
	  fi
	  CHAIN="${CHAIN} --certfile $2"
	  shift 2
	  ;;
    # --- --out: keystore output path (mutually exclusive with positional) ---
    --out)
	  if [[ -n "${STORE}" ]]; then 
		echo "Please only specify either [Store] or --out"
		exit 1
	  fi
	  if [[ -z "$2" ]] || [[ "$2" == --* ]]; then
		echo "$1: Missing or invalid filename"
		exit 1
	  fi
	  [[ ! -f "$2" ]] && NEW_STORE=1
      STORE="$2"
      shift 2
      ;;
	# --- --pass: keystore password ---
	--pass)
	  PASS="$2"
	  shift 2
	  ;;
    # --- unknown flag / help: show usage and exit ---
    --*|?|-h)
      echoUsage
      ;;
	# --- positional [Store]: only one allowed, and not alongside --out ---
	*)
	  if [[ -n "${PARM_POS}" ]]; then
		echo "Please only specify 1 positional parameter"
		exit 1
	  elif [[ -n "${STORE}" ]]; then
		echo "Please only specify either [Store] or --out"
		exit 1
	  else
	    [[ ! -f "$1" ]] && NEW_STORE=1
		STORE="$1"
		PARM_POS=1
		shift
	  fi
	  ;;
  esac
done


# =============================================================================
# SECTION 2: POST-PARSE VALIDATION
# Guard clauses: bail out unless we have a store target and at least one cert.
# Prompt for the store password if none was given, then announce new vs reuse.
# =============================================================================

# --- must have a keystore target ---
if [[ -z "${STORE}" ]]; then
	echo "Please specify [Store] or --out"
	exit 1
fi

# --- must have at least one certificate ---
if [[ ${#CERTS[@]} -eq 0 ]]; then
	echo "Certificates are missing."
	exit 1
fi

# --- prompt for store password if not provided ---
if [[ -z "${PASS}" ]]; then
	echo -n "Please enter the store password: "
	read -es PASS
	echo ""
fi

# --- report whether the keystore will be created or reused ---
[[ -n ${NEW_STORE} ]] && echo "Creating new keystore: ${STORE}" || echo "Using existing keystore: ${STORE}"


# =============================================================================
# SECTION 3: IMPORT MODE SELECTION
# The core branch. Behaviour depends on whether any --key was supplied.
# =============================================================================

# -----------------------------------------------------------------------------
# BRANCH A: TRUSTED CERTIFICATE IMPORT   (no --key given)
# Import each cert as a standalone trusted-cert entry. Duplicates are detected
# by SHA-256 fingerprint; --noprompt is only added when the cert is new.
# -----------------------------------------------------------------------------
if [[ ${#KEYS[@]} -eq 0 ]]; then
	ALIAS="cert_entry"
	ENTRY=0
	for cert in "${CERTS[@]}"; do
		# Loop until keystore alias is not in used
		checkStoreEntryAlias ${ALIAS}
		# Retrieve certificate fingerprint
		CFP=`openssl x509 -in "${cert}" -noout -fingerprint -sha256 | cut -d"=" -f2`
		# Check for duplicate entries by matching certificate fingerprint across Trusted Certificate and Private Key Entries
		[[ `keytool -list -keystore "${STORE}" -storepass "${PASS}" | grep "${CFP}" | wc -l` -eq 0 ]] && NP="--noprompt" || NP=""
		keytool -importcert -file "${cert}" -storetype PKCS12 -keystore "${STORE}" -storepass "${PASS}" -alias "${ALIAS}_${ENTRY}" ${NP}
	done

# -----------------------------------------------------------------------------
# GUARD 1: key/cert count mismatch  (keys given, but count != certs)
# Key mode requires one key per cert, in matching order.
# -----------------------------------------------------------------------------
elif [[ ${#KEYS[@]} -ne ${#CERTS[@]} ]]; then
	echo "Error: ${#KEY[@]} keys specified against ${#CERT[@]} certificates."
	echo "Please make sure the number of keys and certificates specified are the same and in the same order"
	exit 1

# -----------------------------------------------------------------------------
# GUARD 2: key/keypass count mismatch  (keypasses given, but count != keys)
# Either supply a passphrase for every key, or none at all.
# -----------------------------------------------------------------------------
elif [[ ${#KEYS[@]} -ne ${#KEYPASSES[@]} ]] && [[ ${#KEYPASSES[@]} -ne 0 ]]; then
	echo "Error: ${#KEY[@]} keys specified against ${#KEYPASSES[@]} key's passwords."
	echo "Please make sure the number of keys and keys' passwords specified are the same and in the same order, or do not specify any keys' password."
	exit 1

# -----------------------------------------------------------------------------
# BRANCH B: PRIVATE KEY ENTRY IMPORT   (valid --key + --cert pairs)
# For each pair: fingerprint-check against existing PrivateKeyEntry aliases
# (prompt before overwriting), bundle cert+key(+chain) into a temp PKCS12
# store, then import that entry into the target keystore and clean up.
# -----------------------------------------------------------------------------
else
	ALIAS="key_entry"
	ENTRY=0
	for i in "${!CERTS[@]}"; do
		# Loop until keystore alias is not in used
		checkStoreEntryAlias ${ALIAS}
		# Retrieve certificate fingerprint
		CFP=`openssl x509 -in "${CERTS[i]}" -noout -fingerprint -sha256 | cut -d"=" -f2`
		# Check for duplicate entries by matching certificate fingerprint across Private Key Entries only
		ENT=`keytool -list -keystore "${STORE}" -storepass "${PASS}" | grep "${CFP}" -B 1`
		ENT_IS_KEY=`echo ${ENT} | grep PrivateKeyEntry | wc -l`
		# If it already exists as a key entry, ask before re-adding
		if [[ ${ENT_IS_KEY} -ne 0 ]]; then
			ENT_NAME=`echo ${ENT} | grep PrivateKeyEntry | head -1`
			echo -n "Certificate already exists in keystore under= alias <${ENT_NAME%%,*}>
Do you still want to add it? [no]: "
			read -e -n 1 PROCEED
		fi
		# Proceed if new, or if the user confirmed the overwrite
		if [[ ${ENT_IS_KEY} -eq 0 ]] || [[ "${PROCEED,,}" == "y" ]]; then
			# Convert Certificate + Private Key into PKCS12 Keystore format (temporary keystore .tmp)
			[[ -n "${KEYPASSES[i]}" ]] && KEYPASS_PARM="-passin pass:${KEYPASSES[i]}" || KEYPASS_PARM=""
			openssl pkcs12 -export -inkey "${KEYS[i]}" -in "${CERTS[i]}" ${KEYPASS_PARM} ${CHAIN} -out .temp-keystore -passout pass:"${PASS}"
			# Import .temp-keystore keystore in ${STORE}
			keytool -importkeystore -srckeystore .temp-keystore -srcstorepass "${PASS}" -destkeystore "${STORE}" -deststorepass "${PASS}" -srcalias 1 -destalias "${ALIAS}_${ENTRY}" --noprompt
			EXITCODE=$?
			[[ ${EXITCODE} -eq 0 ]] && echo "Imported successful." || echo "Error detected while importing ${CERTS[i]} + ${KEYS[i]}"
			rm -f .temp-keystore
		fi
	done
fi
