var dbTools = require('./lib/dbTools');
var fs = require("fs");
var async = require("async");
var dataDir = __dirname + '/init-tag-data'

dbTools.checkTagTableSetup()
.then(function() {
  fs.readdir( dataDir, function( err, files ) {
    if( err ) {
        console.error( "Could not list the directory.", err );
        process.exit( 1 );
    }
    async.eachSeries(files, function( file, done ) {
      // files are named type.txt
      type = file.split('.')[0];
      dbTools.importTagsFromFile(dataDir + '/' + file, type)
      .then(function() {
        done();
      })
      .catch(function(err) {
        if (err) {
          console.log("Failed with error: ", err);
          dbTools.end();
        }
      });
    }, function(err) { // eachSeries completed
      if (err) {
        console.log("Failed with error: ", err);
      }
      dbTools.end();
    });
  });
});
