# Generate Root Certificate + Server Certificate

This project generates a root certificate (for the Certificate Authority) and server certificate signed by the generate CA cert.

Read https://deliciousbrains.com/ssl-certificate-authority-for-local-https-development/ for more information or google/chatbot for more information. Information about openssl and its documentation is surprisingly obstrufcated - I recommend taking an online course (e.g. Udemy etc) to understand in more details.

# `gen-cert.sh`

```bash
Usage: gen-cert.sh [ecc] [OPTIONS]
	[ecc] : if this is specified, certificated will be generated with Elliptical Curve Cryptography (ECC) instead of RSA.
  Options:
    --root-cert-prefix [prefix] : Script will append prefix with '.crt' and '.key' for '-CA' and '-CAkey' used to sign server certificate. Value cannot be 'server'.
    --root-pass [pass] : Password to be used for root certificate key. Leave out parameter to not use any password.
    --server-pass [pass] : Password to be used for server certificate key. Leave out parameter to not use any password."
```

All certificate details (CN, Org, OU, etc) including password are specified as configuration within the bash script. Please update them accordingly

# `show-cert-details.sh`

```bash
Usage: show-cert-details.sh <certificate/csr file>
```

To display certificate information. If certificate is password protected, it will prompt for password. This script will switch between pem/der certificates, and CSR.

# `verify-cert.sh`

```bash
Usage: $0 <server certificate> <root certificate> [intermediate certificate]
```

To validate server certificate with root certificate.

# Add root certificate to operating system

Refer to https://manuals.gfi.com/en/kerio/connect/content/server-configuration/ssl-certificates/adding-trusted-root-certificates-to-the-server-1605.html

## Linux

```bash
mkdir -p /usr/local/share/ca-certificates
sudo cp <root cert> /usr/local/share/ca-certificates
sudo update-ca-certificates
```

### Windows 

```
certutil -addstore -f "ROOT" new-root-certificate.crt
```