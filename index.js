var path = require('path'),
    https = require('https'),
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