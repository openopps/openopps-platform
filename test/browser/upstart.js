/*
    Launch sails server and load browser tests
*/
var fs = require('fs'),
    spawn = require('child_process').spawn,
    async = require('async'),
    sails,
    err;

// Copy test data into place:
// cp test/browser/data/disk.db .tmp/disk.db
// Doing in JS instead of shell for Windows
// source: http://stackoverflow.com/a/14387791
function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}
copyFile('./test/browser/data/disk.db', './.tmp/test.db', start);

function start(err) {
  if (err) return console.log('error: ', err);

  var config = {
    port: 8888,   // so we can run the app and tests at the same time
    host: 'localhost',
    // turn down the log level so we can view the test results
    log: {
      level: 'error'
    },
    hooks: {
      sockets: false,
      pubsub: false,
      grunt: false
    },
    validateDomains: false,
    emailProtocol: '',
    taskState: 'open',
    draftAdminOnly: false
  };

  // Set environment variables for the child process
  var env = (process.argv.indexOf('development') >= 0) ? 'development' : 'test'
  process.env.NODE_ENV = env;
  process.env.TEST_ROOT= "http://" + config.host + ":" + config.port;

  console.log('lifting sails: env=' + env);

  // Lift Sails and store the app reference
  require('sails').lift(config, function(e, s) {
    sails = s;
    err = e;
    // export properties for upcoming tests with supertest.js
    sails.localAppURL = localAppURL = ( sails.usingSSL ? 'https' : 'http' ) + '://' + sails.config.host + ':' + sails.config.port + '';

    // Recursively call .test.js files
    var testDir = 'test/browser',
        tests = _.filter(fs.readdirSync(testDir), function(filename) {
          return /\.test\.js$/.test(filename);
        });
    console.log('testDir', testDir);
    console.log('tests', tests);
    async.eachSeries(tests, function(test, cb) {
      console.log('testing: ', test)
      var child = spawn('./node_modules/.bin/mocha-casperjs', [
            testDir + '/' + test
          ]);
      child.stdout.on('data', function (data) {
        console.log(''+data);
      });
      child.stderr.on('data', function (data) {
        console.error('stderr: '+data);
      });
      child.on('exit', function (code) {
        if (code !== 0) return cb(code);
        cb();
      });
    }, function(err) {
      sails.lower(function() {
        process.exit(err || 0);
      });
    });

  });
}
