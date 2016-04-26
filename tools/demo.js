var dbTools = require('./lib/dbTools');
var fs = require("fs");
var async = require("async");
var dataDir = __dirname + '/demo-data'

dbTools.checkTableSetup('midas_user')
.then(function() {
    dbTools.importUsersFromFile(dataDir + '/users.csv')
    .then(function() {
      // done();
      console.log('done');
    })
    .catch(function(err) {
      if (err) {
        console.log("Failed with error: ", err);
        dbTools.end();
      }
    });
});
