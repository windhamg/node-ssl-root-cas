var path = require('path'),
    https = require('https'),
    util = require('util'),
    storesDir = path.join(__dirname, 'stores'),
    latestFile = path.join(storesDir, 'ssl-root-cas-latest'),
    originalFile = path.join(storesDir, 'ssl-root-cas'),
    CaStore = require('ca-store'),
    originalStore = RootCas(CaStore.load(originalFile)),
    generating = false;

originalStore.latestFile = latestFile;

module.exports = originalStore;

function RootCas (list) {
    var rootCas = (list || []).slice(0),
        injected = !!(list && list.injected),
        httpsOpts = https.globalAgent.options;
    
    return Object.defineProperties(rootCas, {
        injected: {
            configurable: false,
            enumerable: false,
            get: function getInjected () { return injected; },
            set: function setInjected () { return injected; }
        },
        inject: {
            configurable: false,
            enumerable: false,
            writable: false,
            value: function inject () {
                if (injected) return rootCas;
        
                httpsOpts.ca = (httpsOpts.ca || []).concat(rootCas);
                injected = true;
        
                return rootCas;
            }
        },
        // DEPRECATED
        addFile: {
            configurable: false,
            enumarable: false,
            writable: false,
            value: util.deprecate(function addFile (filepath) {
                // BEGIN TODO
                // What is this filepath stuff all about?
                // (maybe be a leftover MS Windows hack ??)
                // Can we get rid of it?
                var root = (filepath[0] === '/' ? '/' : '');
                var filepaths = filepath.split(/\//g);
                if (root) { filepaths.unshift(root); }
                filepath = path.join.apply(null, filepaths);
                // END TODO
    
                var buf = CaStore.load(filepath);
                rootCas.push.apply(rootCas, buf);
                if (injected) httpsOpts.ca.push.apply(httpsOpts, buf);
                return rootCas;
    
            }, 'rootCas.addFile(filepath) is deprecated, use rootCas.addCert(fs.readFileSync(filepath)) instead')
        },
        addCert:{
            configurable: false,
            enumerable: false,
            writable: false,
            value: function addCert (cert) {
                rootCas.push(cert);
                if (injected) httpsOpts.ca.push(cert);
                return rootCas;
            }
        },
        create:{
            configurable: false,
            enumerable: false,
            writable: false,
            value: function create (list) {
                return RootCas(list || rootCas);
            }
        },
        latest: {
            configurable: false,
            enumerable: false,
            writable: false,
            value: function () {
                if (generating) return generating;
                generating = CaStore.generate(latestFile).then(function (latest) {
                    generating = false;
                    return RootCas(latest);
                });
                return generating;
            }
        }
    });
}