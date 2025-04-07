# Local / Personal Docker Registry (Unsecured)

Refer to https://www.exoscale.com/syslog/securing-private-docker-registry/.

This project shows you how to create your own docker registry in your personal environment (local/remote) with SSL/TLS (HTTPS).

## Pre-requisite

- Docker
- Docker Compose

# Docker Compose

```yml
name: project-registry

services:
  registry:
    container_name: docker-registry
    image: registry:latest
    ports:
      - 45000:5000 # plain-text
      - 45443:443 # SSL

# comment out REGISTRY_HTTP_* variables and /secret volumes to use HTTP instead of HTTPS
    environment:
      - REGISTRY_HTTP_ADDR=0.0.0.0:443
      - REGISTRY_HTTP_TLS_CERTIFICATE=/secret/server.crt
      - REGISTRY_HTTP_TLS_KEY=/secret/server.key
    volumes:
      - ./registry-data:/var/lib/registry
      - ./server.crt:/secret/server.crt
      - ./server.key:/secret/server.key
    restart: always
```

# Update your Docker Daemon Configuration (json)

## Windows Desktop

Go to Settings >> Docker Engine. Add a root element within the json file if you're not using SSL
```json
{
	"insecure-registries": [
		"<DNS/IP URL:PORT>"
	]
}
```

## Linux

Edit `/etc/docker/daemon.json`. Do the same as the instructions in Windows Desktop above.

You might need to locate `daemon.json` if you can't find it in `/etc/docker`.

# Utility Scripts

## `get-repos`

Both Batch and Bash version of this script is available. `--ssl-no-revoke` has been added to batch script's curl to ignore certificate authority certificate revocation status check.

```bash
Usage: $0 [OPTIONS]"
'OPTIONS:
	--tags <repo> : list available tags of Repository
	--CA-cert <file> : specify CA certificate file to use for registries using non-public CAs
	--url <url> : specify registry url to connect to instead of using configured url'
```
