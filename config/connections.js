console.log('Loading... ', __filename);
var cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv(),
    dbURL = appEnv.getServiceURL('psql-openopps');

/**
 * Connections
 * (sails.config.connections)
 *
 * `Connections` are like "saved settings" for your adapters.  What's the difference between
 * a connection and an adapter, you might ask?  An adapter (e.g. `sails-mysql`) is generic--
 * it needs some additional information to work (e.g. your database host, password, user, etc.)
 * A `connection` is that additional information.
 *
 * Each model must have a `connection` property (a string) which is references the name of one
 * of these connections.  If it doesn't, the default `connection` configured in `config/models.js`
 * will be applied.  Of course, a connection can (and usually is) shared by multiple models.
 * .
 * Note: If you're using version control, you should put your passwords/api keys
 * in `config/local.js`, environment variables, or use another strategy.
 * (this is to prevent you inadvertently sensitive credentials up to your repository.)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html
 */

module.exports.connections = {
  memory: {
    adapter: 'sails-disk',
    inMemory: true
  },

  local: {
    adapter: 'sails-disk'
  },

  // POSTGRES
  // Set your postgres database settings here, including the username, password
  // and database name
  postgresql: {
    adapter     : 'sails-postgresql',
    host        : 'localhost',
    user        : 'midas',
    password    : 'midas',
    database    : 'midas',
    // populateFast: true  -- removed with sails 0.12.1 upgrade
    // TODO: delete?       -- was this part of soft-delete implementation?
  }

};

if (dbURL) {
  module.exports.connections = {
    postgresql: {
      adapter: 'sails-postgresql',
      url: dbURL,
      populateFast: true
    }
  };
  module.exports.models = {
    connection: 'postgresql'
  };
}
