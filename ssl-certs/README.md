# Generate Root Certificate + Server Certificate

This project generates a root certificate (for the Certificate Authority) and server certificate signed by the generated CA cert.

`gen-cert.sh` generates the certificates without additional/temporary configuration files. However, if the generated certificate does not produce expected results, please check/compare openssl configuration file `/etc/ssl/openssl.cnf` in case your system has different default values.

Read https://deliciousbrains.com/ssl-certificate-authority-for-local-https-development/ for more information or google/chatbot for more information. Information about openssl and its documentation is surprisingly obstrufcated - I recommend taking an online course (e.g. Udemy etc) to understand in more details.

# Key OpenSSL information to take note

1. Wildcard certificates only apply for third-level domains and onwards.
2. To carry over x509 extensions (e.g. SAN, keyUsage, etc.) in CSR for CA-signed certificates, use `-copy_extensions copy` when generating the certificate [OpenSSL x509 Doc](https://docs.openssl.org/3.0/man1/openssl-x509/).
   - Take note that usual Certificate Authority do not use `-copy_extensions` as the CSR can contain insecured parameters (e.g. CA:TRUE).
   - using `-ext` in combination with `-copy_extensions` can specify the list of extensions to copy over. Refer to [x509_config](https://docs.openssl.org/3.2/man5/x509v3_config/) for list of values.
3. Modern browsers require extensions `keyUsage` & `extendedKeyUsage` to be specified correctly.
4. `openssl` configuration file `/etc/ssl/openssl.cnf` might have conflicting / overriding configuration specified. Please check the file if generated certificate does not align with specified parameters.
5. OpenSSL trust settings are only used for root certificates. Future versions of OpenSSL will recognize this in all certificates.


# `gen-cert.sh`

```bash
Usage: gen-cert.sh [OPTIONS]

    This script will generate certificate (.crt), key (.crt), and password (.pass) for both CA and server, and certificate signing request (.csr) for server.

        Password file will not be generated if password is empty. By default, scripts does not use any password for certificate generation/signing.

        Script utillizes only RSA algorithm.

        Documentation: https://github.com/hafio/solace-psg/tree/main/ssl-certs

  Options:
    --root-cert-name <name> : Root certificate output filename prefix.
    --root-cert-prefix <prefix> : Root certificate input filename prefix. This option will skip root certificate creation.
    --root-pass <pass> : Password to be used for root certificate key.
    --server-cert-name <prefix> : Server certificate output filename prefix.
    --server-pass <pass> : Password to be used for server certificate key.
```

| Script parameter     | Description                                                                                                                                                                                       |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--root-cert-name`   | Used to specify the root certificate output filename prefix for .crt, .key, .pass files. e.g. `--root-cert-name CA-cert` will produce `CA-cert.crt` `CA-cert.key` `CA-cert.pass`.                 |
| `--root-cert-prefix` | Used to specify the root certificate filename prefix for a root certificate that was previously generated. This option, when specified, will skip root certificate generation.                    |
| `--root-pass`        | Used to specify root certificate password. This is used to specify root password to be used for root certificate generation and also the root input password used to sign the server certificate. |
| `--server-cert-name` | Used to specify the server certificate output filename prefix for .crt, .key, .pass files. e.g. `--server-cert-name svr-cert` will produce `svr-cert.crt` `svr-cert.key` `svr-cert.pass`.         |
| `--server-pass`      | Used to specify the server certificate password.                                                                                                                                                  |

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