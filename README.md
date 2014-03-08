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

Usage
=====

```javascript
'use strict';

var https = require('https')
  , cas
  ;
  
// This will add the well-known CAs
// to `https.globalAgent.options.ca`
require('ssl-root-cas').inject();

cas = https.globalAgent.options.ca;

cas.push(fs.readFileSync(path.join(__dirname, 'ssl', '01-cheap-ssl-intermediary-a.pem')));
cas.push(fs.readFileSync(path.join(__dirname, 'ssl', '02-cheap-ssl-intermediary-b.pem')));
cas.push(fs.readFileSync(path.join(__dirname, 'ssl', '03-cheap-ssl-site.pem')));
```

For the sake of version consistency this package ships with the CA certs that were
available at the time it was published.

If you want the latest certificates (downloaded as part of the postinstall process), 
you can require those instead like so:

```
require('ssl-root-cas/latest').inject();
```

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
