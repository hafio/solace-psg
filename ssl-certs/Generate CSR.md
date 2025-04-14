# Generate Certificate Signing Request (CSR)

This page will try to explain how to generate your own CSR to be passed to the Certificate Authority (CA) for generation SSL certificate.

# `openssl` command

Execute `openssl req -newkey rsa:4096 -nodes -keyout server.key -out server.csr -addext "basicConstraints=critical,CA:FALSE" -addext "keyUsage=critical,digitalSignature,keyEncipherment,dataEncipherment" -addext "extendedKeyUsage=critical,serverAuth"` to get the below output:

```bash
user@box:~# openssl req -newkey rsa:4096 -nodes -keyout server.key -out server.csr \
-addext "basicConstraints=critical,CA:FALSE" \
-addext "keyUsage=critical,digitalSignature,keyEncipherment,dataEncipherment" \
-addext "extendedKeyUsage=critical,serverAuth"
..+...+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*......+.........+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*.+.+.....+....+......+........+.+.....+............+...+.......+............+...+.....+....+...........+...+.........+...............+............+.+..+...+....+........+.......+......+........+....+......+...........+...+.............+........+......................+..+......+.......+...............+..............+.............+......+.....+.+.........+......+...............+.....+.............+...+..+..........+........+.............+..+...............+...+.+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
.............+.+...........+...+.......+..+..........+........+...+......+.+............+..+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*...+....+......+...+..+.+.....+...+...................+..+.+..............+......+....+...+...+........+......+.+..+......+............+...+.+.....+.+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*....+...+......+..+.............+.................+.......+.....+.............+..+............+.+............+..+......+.......+...............+.....+...............+.+.....+.........+................+.....+.+...........+...+.+......+............+...........+.......+...+..+.......+..+...+.......+...+......+..+....+......+..+......+..........+......+.....+.....................+............+.+...........+...+...+..........+.......................+...............+.......+..+..................+...+......+......+.......+..+....+.....+....+...+.........+.....+....+......+.........+.........+.....+...+....+......+...+.....................+........+...............+.......+...+...........+.+......+.....+..........+........+............+...............+....+...+........+...+.+.........+..+...+......................+..+......+...............+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:SG
State or Province Name (full name) [Some-State]:Singapore
Locality Name (eg, city) []:Amoy Street
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Solace
Organizational Unit Name (eg, section) []:Professional Services Group
Common Name (e.g. server FQDN or YOUR name) []:www.solace.com
Email Address []:it@solace.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:P@55w0rd
An optional company name []:Solace
```

> - New private key generated 
> - Utilizing RSA 4096 bit encryption
> - User will be prompted for Subject values (i.e. Common Name, Country, State, etc.)
> - `-addext basicConstraints` is required to indicate if this certificate is a Certificate Authority
> - `-addext keyUsage` is required to indicate the purpose of this certificate. Applications can reject certificates if Key Usage are not utilized correctly.
> - `-addext extendedKeyUsage` is required to indicate additional purpose of this certificate. Applications can reject certificates if Key Usage and Extended Key Usage are not utilized correctly.

### If you want to specify the Subject values without being prompted
add `-subj "<VALUES>"` where `<values>` are a concatenation of the below:
> - Country: `/C=XX`
> - State: `/ST=XXXXX+`
> - Locality: `/L=XXXXX+`
> - Organization Name: `/O=XXXXX+`
> - Organizational Unit: `/OU=XXXXX+`
> - Common Name: `/CN=XXXXX+`
> - Email: `/emailAddress=XXXXX+@XXX+.XXX+`

Example: `openssl req -newkey rsa:4096 -nodes -keyout server.key -out server.csr -subj "/CN=Test Certificate/C=SG/O=Solace/OU=PSG/emailAddress=test@test.com" -addext "basicConstraints=critical,CA:FALSE" -addext "keyUsage=critical,digitalSignature,keyEncipherment,dataEncipherment" -addext "extendedKeyUsage=critical,serverAuth"`
