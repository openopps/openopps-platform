const koa = require('koa');
const app = new koa();

module.exports = async () => {
  // load environment variables and configuration
  global.openopps = require('./openopps-setup');

  // load middlewares
  require('./middleware-setup')(app);

  // configure session and security
  await require('./security-setup')(app);

  // redirect any request coming other than openopps.hostName
  require('./redirect')(app);

  // configure serving resources
  require('./serve-resources')(app);

  // load our features (i.e. our api controllers)
  require('./features')(app);

  app.listen(openopps.port);
  console.log('App running at ' + openopps.hostName);
};
