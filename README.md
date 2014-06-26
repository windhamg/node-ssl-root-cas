SSL Root CAs
=================

The module you need to solve node's SSL woes when including a custom certificate.

Let's say you're trying to connect to a site with a cheap-o SSL cert -
such as RapidSSL certificate from [name.com](http://name.com) (the **best** place to get your domains, btw) -
you'll probably get an error like `UNABLE_TO_VERIFY_LEAF_SIGNATURE` and after you google around and figure that
out you'll be able to connect to that site just fine, but now when you try to connect to other sites you get
`CERT_UNTRUSTED` or possibly other errors.

This module is the solution to your woes!

FYI, I'm merely the publisher, not the author of this module.
See here: https://groups.google.com/d/msg/nodejs/AjkHSYmiGYs/1LfNHbMhd48J

The script downloads the same root CAs that are included with
[Mozilla Firefox](http://www.mozilla.org/en-US/about/governance/policies/security-group/certs/included/),
[Google Chrome](http://www.chromium.org/Home/chromium-security/root-ca-policy),
[`libnss`](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS#CA_certificates_pre-loaded_into_NSS),
and [OpenSSL](https://www.openssl.org/support/faq.html#USER16)\*:
<https://mxr.mozilla.org/nss/source/lib/ckfw/builtins/certdata.txt?raw=1>

\* OpenSSL doesn't actually bundle these CAs, but they suggest using them

**Other Implementations**

  * Golang <https://github.com/agl/extract-nss-root-certs>
  * Perl <https://github.com/bagder/curl/blob/master/lib/mk-ca-bundle.pl>

Usage
=====

```javascript
'use strict';
 
// This will add the well-known CAs
// to `https.globalAgent.options.ca`
require('ssl-root-cas/latest')
  .inject()
  .addFile(__dirname + '/ssl/01-cheap-ssl-intermediary-a.pem')
  .addFile(__dirname + '/ssl/02-cheap-ssl-intermediary-b.pem')
  .addFile(__dirname + '/ssl/03-cheap-ssl-site.pem')
  ;
```

For the sake of version consistency this package ships with the CA certs that were
available at the time it was published,
but for the sake of security I recommend you use the latest ones.

If you want the latest certificates (downloaded as part of the postinstall process), 
you can require those like so:

```
require('ssl-root-cas/latest').inject();
```

You can use the ones that shippped with package like so:

```
require('ssl-root-cas').inject();
```

API
---

### inject()

I thought it might be rude to modify `https.globalAgent.options.ca` on `require`,
so I afford you the opportunity to `inject()` the certs at your leisure.

`inject()` keeps track of whether or not it's been run, so no worries about calling it twice.

### addFile(filepath)

This is just a convenience method so that you don't
have to require `fs` and `path` if you don't need them.

```javascript
require('ssl-root-cas/latest')
  .addFile(__dirname + '/ssl/03-cheap-ssl-site.pem')
  ;
```

is the same as

```javascript
var https = require('https')
  , cas
  ;
 
cas = https.globalAgent.options.ca || [];
cas.push(fs.readFileSync(path.join(__dirname, 'ssl', '03-cheap-ssl-site.pem')));
```

### rootCas

If for some reason you just want to look at the array of Root CAs without actually injecting
them, or you just prefer to
`https.globalAgent.options.ca = require('ssl-root-cas').rootCas;`
yourself, well, you can.

BAD IDEAS
===

Don't use dissolutions such as these. :-)

This will turn off SSL validation checking. This is not a good idea. Please do not do it.
(really I'm only providing it as a reference for search engine seo so that people who are trying
to figure out how to avoid doing that will end up here)

```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
```

The same dissolution from the terminal would be

```bash
export NODE_TLS_REJECT_UNAUTHORIZED="0"
node my-service.js
```

# Index

Other information you might want to know while you're here.

## Generating an SSL Cert

Just in case you didn't know, here's how you do it:

```
openssl req -new -newkey rsa:2048 -nodes -keyout server.key -out server.csr
```

**DO NOT FILL OUT** email address, challenge password, or optional company name

However, you *should* fill out country name, FULL state name, locality name, organization name.

*organizational unit* is optional.

```
cat server.csr
```

That creates a sha-1 hash.

When you submit that to the likes of RapidSSL you'll get back an X.509 that you should call `server.crt` (at least for the purposes of this mini-tutorial).

You cannot use "bundled" certificates (`.pem`) with node.js.

### the server

Here's a complete working example:

```javascript
'use strict';

var https = require('https')
  , fs = require('fs')
  , connect = require('connect')
  , app = connect()
  , sslOptions
  , server
  , port = 4080
  ;

require('ssl-root-cas/latest')
  .inject()
  .addFile(__dirname + '/ssl/Geotrust Cross Root CA.txt')
  .addFile(__dirname + '/ssl/Rapid SSL CA.txt')
  ;

sslOptions = {
  key: fs.readFileSync('./ssl/server.key')
, cert: fs.readFileSync('./ssl/server.crt')
};

app.use('/', function (req, res) {
  res.end('<html><body><h1>Hello World</h1></body></html>');
});

server = https.createServer(sslOptions, app).listen(port, function(){
  console.log('Listening on https://' + server.address().address + ':' + server.address().port);
});
```
