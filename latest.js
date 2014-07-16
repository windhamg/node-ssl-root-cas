'use strict';

var fs = require('fs')
  , path = require('path')
  , generate = require('./ca-store-generator').generate
  , latestFile = path.join(__dirname, 'ssl-root-cas-latest.js')
  ;

if (!fs.existsSync(latestFile)) {
  console.log('needs latest', latestFile);
  module.exports = require('./ssl-root-cas');
  generate(latestFile).then(function () {
    console.info('\n');
    console.info('##########################################################################################');
    console.info('#                                                                                        #');
    console.info('#  Downloaded the latest Root Certificate Authorities. Restart your server to use them.  #');
    console.info('#                                                                                        #');
    console.info('##########################################################################################');
    console.info('\n');
  }, function (e) {
    console.warn('\n\n');
    console.warn("Couldn't download the latest Root CAs, but it's not a big deal.");
    console.warn('');
    console.warn('Use "require(\'ssl-root-cas\')" instead of "require(\'ssl-root-cas/latest\')"');
    console.warn('');
  });
} else {
  console.log('has latest');
  module.exports = require('./ssl-root-cas-latest');
}
