# Changelog

## 2.0.0
* Removed `.addFile()` in favor of `.addCert()` to eliminate the need to perform any kind of filesytem or platform-level
checks on provided paths within the project.
* Changed behavior of `.inject()` to track injected status on a per-instance basis
* Added `.injected` flag as read-only to inform users of injected status 
* Changed behavior of `.addFile()` (now `.addCert()`) to automatically inject any new files added after `.inject` has 
been called.
* Added `.latest()` method to instances, to pull and save latest certs without the warning message and return them once 
the download is complete
* moved downloaded files to ./stores directory. PEMs are under ./stores/pems, and the ssl-root-cas*.js files contain
only arrays of the PEMs, no application logic.