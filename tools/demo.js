var Promise = require('bluebird');
var Sails = require('sails').constructor;
var sailsApp = new Sails();

var dbTools = require('./lib/dbTools');
var sailsModel = require('./lib/modelTools');
var dataDir = __dirname + '/demo-data'
var sailsLift = Promise.promisify(sailsApp.lift, {context: sailsApp});

dbTools.checkTableSetup('midas_user')
.then(function() {
  return sailsLift({
      log: {
        level: 'error'
      },
      emailProtocol: ''
    });
})
.then(function(liftedApp) {
  // Note that liftedApp === sailsApp
  console.log('config connections:', liftedApp.config.connections);
  console.log('config models.connection:', liftedApp.config.models.connection);
  return sailsModel.importFromFile(sails.models['user'], dataDir + '/users.csv');
})
.then(function(users) {
  console.log('new users created: ', users);
  return sailsModel.importFromFile(sails.models['task'], dataDir + '/tasks.csv')
})
.then(function(tasks) {
  console.log('new tasks created: ', tasks);
  console.log("Sails app lifted successfully: http://localhost:"+sailsApp.config.port);
})
.catch(function(err) {
  console.log('err: ', err)
});
