# Generate Root Certificate + Server Certificate

This project generates a root certificate (for the Certificate Authority) and server certificate signed by the generate CA cert.

Read https://deliciousbrains.com/ssl-certificate-authority-for-local-https-development/ for more information or google/chatbot for more information. Information about openssl and its documentation is surprisingly obstrufcated - I recommend taking an online course (e.g. Udemy etc) to understand in more details.

# `gen-cert.sh`

```bash
Usage: gen-cert.sh [ec]
  If "ec" is specified, certificates will be generated using Elliptical Curve Cryptography (ECC) instead of RSA.
```

All certificate details (CN, Org, OU, etc) including password are specified as configuration within the bash script. Please update them accordingly

# `show-cert-details.sh`

Use to display certificate information. If certificate is password protected, it will prompt for password. This script will switch between pem/der certificate formats.