#!/bin/bash

LEN_INPUT=$1
LEN=${LEN_INPUT:-32}

openssl rand -base64 ${LEN} | tr -d '\n'