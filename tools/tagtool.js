#! /usr/bin/env node

function help_and_quit(msg) {
  if(msg) {
    console.log("Error:\n    " + msg + "\n");
  }
  console.log("This is a tool for loading tags into the database in bulk.\n" +
              "\n" +
              "Usage:\n" +
              "    ./tagtools.js [type] [file]\n" +
              "\n" +
              "    type - The string type of tags to be loaded\n" +
              "    file - file containing a newline delimited list of tag values to be loaded\n");
  process.exit(1);
}

var fs = require('fs');
var pg = require('pg');
var dbTools = require('./lib/dbTools');

var args = process.argv.slice(2);

if (args.length < 2) {
  help_and_quit();
}

var tagType = args[0];
var tagFile = args[1];

if (tagType.length === 0) {
  help_and_quit('Tag type must be provided.');
}

dbTools.checkTagTableSetup()
.then(function() {
  dbTools.importTagsFromFile(tagFile, tagType)
  .then(function() {
    console.log('done');
    dbTools.end();
  })
  .catch(function(err) {
    console.log("\n",err.message,"\n");
    dbTools.end();
  });
})
