'use strict';

var fs = require('fs'),
    path = require('path'),
    log = require('invigilate')(module),
    CaStore = require('ca-store'),
    originalStore = require('.'),
    latest = CaStore.load(originalStore.latestFile);

log.default = console;

if (!latest.length) {
    log.debug('Needs latest SSL Root Certificate Authority data', originalStore.latestFile);
    module.exports = originalStore;
    CaStore.generate(originalStore.latestFile).then(success).catch(error);
} else {
    module.exports = originalStore.create(latest);
}

function success () {
    log.info('\n');
    log.info('##########################################################################################');
    log.info('#                                                                                        #');
    log.info('#  Downloaded the latest Root Certificate Authorities. Restart your server to use them.  #');
    log.info('#                                                                                        #');
    log.info('##########################################################################################');
    log.info('\n');
}

function error () {
    log.warn('\n\n');
    log.warn("Couldn't download the latest Root CAs, but it's not a big deal.");
    log.warn('');
    log.warn('Use "require(\'ssl-root-cas\')" instead of "require(\'ssl-root-cas/latest\')"');
    log.warn('');
}
