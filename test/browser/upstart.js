/*
    Launch sails server and load browser tests
*/
var fs = require('fs'),
    spawn = require('child_process').spawn,
    sails,
    err;

console.log('lifting sails: env='+process.env.NODE_ENV );

var config = {
  // turn down the log level so we can view the test results
  log: {
    level: 'error'
  },
  hooks: {
    grunt: false
  }
}

// Lift Sails and store the app reference
require('sails').lift(config, function(e, s) {
  sails = s;
  err = e;
  // export properties for upcoming tests with supertest.js
  sails.localAppURL = localAppURL = ( sails.usingSSL ? 'https' : 'http' ) + '://' + sails.config.host + ':' + sails.config.port + '';

  var test = spawn('./node_modules/.bin/mocha-casperjs', ['test/browser/browser.js']);
  test.stdout.on('data', function (data) {
    console.log(''+data);
  });

  test.stderr.on('data', function (data) {
    console.error('stderr: '+data);
  });

  test.on('exit', function (code) {
    sails.lower(function() {
      process.exit(code);
    });
  });
});
