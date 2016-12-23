'use strict';

var Promise = require('bluebird'),
    invigilate = require('invigilate'),
    log = invigilate(module);

invigilate.loggers.default = console;

testLatest();

function testLatest () {
    var rootCasLatest = require('.').latest();
    var latest = require('./latest').latest();
    if (rootCasLatest !== latest) throw new Error('should have returned the same promise');
    Promise.join(rootCasLatest, latest, function (latest1, latest2) {
        if (latest1 !== latest2) throw new Error('should have returned the same list');
        testDefault();
    })
}
// backwards compat
function testDefault() {
    require('https').globalAgent.options.ca = null;
    var rootCas = require('./latest');
    var request = require('request');
    
    require('https').globalAgent.options.ca = rootCas;
    request.get('https://daplie.com/404.html', function (err, resp, body) {
        if (err) {
            throw err;
        }
        
        testInject();
    });
}

function testInject() {
    require('https').globalAgent.options.ca = null;
    var rootCas = require('./latest').inject();
    var request = require('request');
    
    require('https').globalAgent.options.ca = rootCas;
    request.get('https://daplie.com/404.html', function (err, resp, body) {
        if (err) {
            throw err;
        }
        
        testCreate();
    });
}

function testCreate() {
    require('https').globalAgent.options.ca = null;
    var rootCas = require('./latest').create();
    var request = require('request');
    
    require('https').globalAgent.options.ca = rootCas;
    request.get('https://daplie.com/404.html', function (err, resp, body) {
        if (err) {
            throw err;
        }
        
        log.info(body);
    });
}

// TODO test with a company certificate
