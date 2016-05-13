console.log('Loading... ', __filename);

// load package.json for the version
var pkg = require('../package.json');

/**
 * Loads version information about the currently deployed
 * code base.
 */
module.exports = {

  version: pkg.version

};
