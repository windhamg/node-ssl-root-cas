'use strict';

// Explained here: https://groups.google.com/d/msg/nodejs/AjkHSYmiGYs/1LfNHbMhd48J

var fs = require('fs')
  , path = require('path')
  , request = require('request')
  , CERTDB_URL = 'https://mxr.mozilla.org/nss/source/lib/ckfw/builtins/certdata.txt?raw=1'
  , OUTFILE = path.join(__dirname, './ssl-root-cas-latest.js')
  , HEADER
  ;

HEADER =
  "/**\n" +
  " * Mozilla's root CA store\n" +
  " *\n" +
  " * generated from " + CERTDB_URL + "\n" +
  " */\n\n";

function Certificate() {
  this.name = null;
  this.body = '';
  this.trusted = true;
}

Certificate.prototype.quasiPEM = function quasiPEM() {
  var bytes = this.body.split('\\')
    , offset = 0
    , converted
    ;

  bytes.shift();
  converted = new Buffer(bytes.length);
  while(bytes.length > 0) {
    converted.writeUInt8(parseInt(bytes.shift(), 8), offset++);
  }

  return '  // ' + this.name + '\n' +
         '  "-----BEGIN CERTIFICATE-----\\n" +\n' +
         converted.toString('base64').replace(/(.{1,76})/g, '  "$1\\n" +\n') +
         '  "-----END CERTIFICATE-----\\n"';
};

function parseBody(current, lines) {
  var line
    ;

  while (lines.length > 0) {
    line = lines.shift();
    if (line.match(/^END/)) { break; }
    current.body += line;
  }

  while (lines.length > 0) {
    line = lines.shift();
    if (line.match(/^CKA_CLASS CK_OBJECT_CLASS CKO_NSS_TRUST/)) { break; }
  }

  while (lines.length > 0) {
    line = lines.shift();
    if (line.match(/^#|^\s*$/)) { break; }
    if (line.match(/^CKA_TRUST_SERVER_AUTH\s+CK_TRUST\s+CKT_NSS_NOT_TRUSTED$/) ||
        line.match(/^CKA_TRUST_SERVER_AUTH\s+CK_TRUST\s+CKT_NSS_TRUST_UNKNOWN$/)) {
      current.trusted = false;
    }
  }

  if (current.trusted) return current;
}

function parseCertData(lines) {
  var certs = []
    , line
    , current
    , skipped = 0
    , match
    , finished
    ;

  while (lines.length > 0) {
    line = lines.shift();

    // nuke whitespace and comments
    if (line.match(/^#|^\s*$/)) continue;

    if (line.match(/^CKA_CLASS CK_OBJECT_CLASS CKO_CERTIFICATE/)) {
      current = new Certificate();
    }

    if (current) {
      match = line.match(/^CKA_LABEL UTF8 \"(.*)\"/);
      if (match) {
        current.name = match[1];
      }

      if (line.match(/^CKA_VALUE MULTILINE_OCTAL/)) {
        finished = parseBody(current, lines);
        if (finished) {
          certs.push(finished);
        }
        else {
          skipped++;
        }
        current = null;
      }
    }
  }

  console.info("Skipped %s untrusted certificates.", skipped);
  console.info("Processed %s certificates.", certs.length);

  return certs;
}

function dumpCerts(certs) {
  certs.forEach(function (cert, i) {
    var pathname = path.join(__dirname, 'pems', 'ca-' + i + '.pem')
      ;

    fs.writeFileSync(pathname, cert.quasiPEM());
  });
  console.info("Wrote " + certs.length + " certificates in '"
    + path.join(__dirname, 'pems/').replace(/'/g, "\\'") + "'.");

  fs.writeFileSync(
    OUTFILE
  , HEADER
      + 'var cas = module.exports = [\n'
      + certs.map(function (cert) { return cert.quasiPEM(); }).join(',\n\n')
      + '\n];\n'
      + "module.exports.inject = function () {\n"
      + "  var opts = require('https').globalAgent.options;\n"
      + "  if (!opts.ca || !opts.ca.__injected) { opts.ca = (opts.ca||[]).concat(cas); }\n"
      + "  opts.ca.__injected = true;\n"
      + "};\n"
  );
  console.info("Wrote '" + OUTFILE.replace(/'/g, "\\'") + "'.");
}

request(CERTDB_URL, function (error, response, body) {
  if (error) {
    console.error(error.stacktrace);
    process.exit(1);
  }

  if (response.statusCode !== 200) {
    console.error("Fetching failed with status code %s", response.statusCode);
    process.exit(2);
  }

  var lines = body.split("\n");
  dumpCerts(parseCertData(lines));
});
