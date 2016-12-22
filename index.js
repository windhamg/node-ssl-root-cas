var path = require('path'),
    https = require('https'),
    storesDir = path.join(__dirname, 'stores'),
    latestFile = path.join(storesDir, 'ssl-root-cas-latest'),
    originalFile = path.join(storesDir, 'ssl-root-cas'),
    CaStore = require('ca-store'),
    originalStore = RootCas(CaStore.load(originalFile));

originalStore.latestFile = latestFile;
originalStore.latest = function () { return CaStore.generate(latestFile); };

module.exports = originalStore;

function RootCas (list) {
    var rootCas = (list || []).slice(0),
        injected = false,
        httpsOpts = https.globalAgent.options;
    
    rootCas.inject = function inject () {
        if (injected) return rootCas;
        
        httpsOpts.ca = (httpsOpts.ca || []).concat(rootCas);
        injected = true;
        
        return rootCas;
    };
    
    rootCas.addCert = function (cert) {
        rootCas.push(cert);
        if (injected) httpsOpts.ca.push(cert);
        return rootCas;
    };
    
    rootCas.create = function (list) {
        return RootCas(list || rootCas);
    };
    
    return rootCas;
}