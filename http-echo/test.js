PS C:\Users\hamly\git\hafio-solace-psg\http-echo> docker compose run --rm --entrypoint sh http-echo -c "node -e \"const https=require('https'),fs=require('fs');https.createServer({cert:fs.readFileSync('/app/fullchain.pem'),key:fs.readFileSync('/app/privkey.pem')});console.log('OK')\""
Container proj-http-echo-http-echo-run-de7514c3819e Creating
Container proj-http-echo-http-echo-run-de7514c3819e Created
sh: syntax error: unterminated quoted string

https.createServer : The term 'https.createServer' is not recognized as the name of a cmdlet, function, script
file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is
correct and try again.
At line:1 char:111
+ ... st https=require('https'),fs=require('fs');https.createServer({cert:f ...
+                                                ~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (https.createServer:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException

console.log : The term 'console.log' is not recognized as the name of a cmdlet, function, script file, or operable
program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:1 char:216
+ ... n.pem'),key:fs.readFileSync('/app/privkey.pem')});console.log('OK')\" ...
+                                                       ~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (console.log:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException