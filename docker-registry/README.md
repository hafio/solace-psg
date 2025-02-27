# Local / Personal Docker Registry

This project shows you how to create your own docker registry in your personal environment (local/remote).

## Pre-requisite

- Docker
- Docker Compose

# Docker Compose

Use the provided `docker-compose.yaml` file to spin up the registry instance.
> Update the port to be exposed. The example uses port `45000` instead of the usual `5000`

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

# Docker Compose SSL

> NOT TESTED YET

If you would like to setup a secured registry, use the below `docker-compose.yaml`:
```yaml
name: project-registry

services:
  registry:
    container_name: docker-registry
    image: registry:latest
    ports:
      - 45443:443
	environment:
	  - REGISTRY_HTTP_ADDR=0.0.0.0"443
	  - REGISTRY_HTTP_TLS_CERTIFICATE=/path/to/server/cert
	  - REGISTRY_HTTP_TLS_KEY=/path/to/server/cert/key
	volumes:
	  - /image/dir:/var/lib/registry
	  - /hostpath/to/server/cert:/path/to/server/cert
	  - /hostpath/to/server/cert/key:/path/to/server/cert/key
    restart: always
```
> `/var/lib/registry` is used to store docker registry images. If you want to externalize the storage, you can 

# Utility Scripts

## `get-repos`

Both Batch and Bash version of this script is available.

```bash
Usage get-repos [tags] [repository]
if "tags" is entered as the first positional argument, a repository name is expected in the second position.
Otherwise you can just execute `get-repos` to retrieve the full list of repositories (images) in the registry.

The URL of the registry is specified as a configuration within the script.