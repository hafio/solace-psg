# IBM MQ Container

This example shows you how to start up an IBM MQ Container and use its web console.

# `docker-compose.yaml`

```
name: ibmmq

services:
  qm:
    container_name: qm
#    image: ibmcom/mq:latest
    image: icr.io/ibm-messaging/mq:latest
    ports:
      - "11414:1414"
      - "19443:9443"
    environment:
      - LICENSE=accept
      - MQ_QMGR_NAME=QM1
      - MQ_ADMIN_PASSWORD=admin
      - MQ_APP_PASSWORD=Passw0rd
      - TZ=Asia/Singapore
    volumes:
      - qm1data:/mnt/mqm
#      - ./cert:/etc/mqm/pki/keys
    stdin_open: true
    tty: true
    restart: always
    
volumes:
 qm1data:
```
> Change the port in `docker-compose.yaml` accordingly, and the app `mqm` password and admin `admin` password.
> 
# Run

Execute `docker-compose up -d`.

You should be able to access https://<container-hostname>:19443/ibmmq/console.

# SSL/TLS

[TODO]

# New User Accounts

This can only be achieve through LDAP. MQ v9.1.5 or later does not allow authentication via OS local users.