'use strict';

var Promise = require('bluebird'),
    invigilate = require('invigilate'),
    path = require('path'),
    https = require('https'),
    request = Promise.promisifyAll(require('request')),
    log = invigilate(module);

invigilate.loggers.default = console;

Promise.try(() => testLatest()).then(success).catch(error);

function success (retval) {
    log.info(retval);
    process.exit(0);
}

function error (err) {
    log.error(err.stack);
    process.exit(1);
}

function testLatest () {
    var rootCasLatest = require('.').latest();
    var latest = require('./latest').latest();
    if (rootCasLatest !== latest) throw new Error('should have returned the same promise');
    return Promise.join(rootCasLatest, latest, function (latest1, latest2) {
        if (latest1 !== latest2) throw new Error('should have returned the same list');
        return testDefault();
    })
}
// backwards compat
function testDefault() {
    https.globalAgent.options.ca = require('.');
    
    return request.getAsync('https://daplie.com/404.html').then(testInject);
}

function testInject() {
    https.globalAgent.options.ca = null;
    require('./latest').inject();
    
    return request.getAsync('https://daplie.com/404.html').then(testAddFile);
}

function testDeprecation () {
    process.throwDeprecation = true;
    try {
        require('./latest').create([]).addFile(path.join(__dirname, 'stores', 'pems'));
    }
    catch (err) {
        process.throwDeprecation = false;
        return testAddFile();
    }
    throw new Error('should have thrown an error for the deprecated addFile() function');
}

function testAddFile () {
    https.globalAgent.options.ca = null;
    require('./latest').create([]).addFile(path.join(__dirname, 'stores', 'pems')).inject();
    return request.getAsync('https://daplie.com/404.html').then(testCreate);
}

function testCreate() {
    https.globalAgent.options.ca = null;
    require('./latest').create().inject();
    
    return Promise.fromNode(cb => request.get('https://daplie.com/404.html', function (err, resp, body) {
        if (err) return cb(err);
        cb(null, body);
    }));
}

// TODO test with a company certificate
