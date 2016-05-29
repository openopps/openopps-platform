var sails = require('sails');

before(function(done) {
  console.log('lifting sails: env='+process.env.NODE_ENV );

  var config = {
    environment: 'test',
    port: 9999,   // so we can run the app and tests at the same time
    hostName: 'localhost:9999',
    // turn down the log level so we can view the test results
    log: {
      level: 'error'
    },
    hooks: {
      sockets: false,
      pubsub: false
    },
    csrf: false,
    connections: {
      defaultTestDB: {
        adapter: 'sails-memory'
      }
    },
    models: {
      connection: 'defaultTestDB'
    },
    emailProtocol: ''
    // TODO: validateDomains: false,
    // TODO: requireAgency: false,
    // TODO: requireLocation: false,
    // TODO: taskState: 'draft',
    // TODO: draftAdminOnly: false,
  };
  sails.lift(config, function(err, server) {
    if (err) return done(err);
    // here you can load fixtures, etc.
    done(err, sails);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});

beforeEach(function(done) {
  if ( sails.config.models.connection == 'postgresql') {
    console.log('note: using postgresql connection, not dropping test data');
  }
  // When we're using the memory database...
  // this will drop database between each test.
  // Also causes all models to be reloaded.
  sails.once('hook:orm:reloaded', done);
  sails.emit('hook:orm:reload');
});
