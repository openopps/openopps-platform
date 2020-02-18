const koa = require('koa');
const app = new koa();
const fs = require('fs');

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

  if (process.env.APP_ENV == 'LOCAL') {
    const https = require('https');
    var options = {
      pfx: fs.readFileSync(process.env.PFX),
      passphrase: process.env.PASSPHRASE,
    };
    https.createServer(options, app.callback()).listen(process.env.PORT, process.env.HOSTNAME);
    console.log(`App running at ${process.env.PROTOCOL}://${process.env.HOST}`);
  } else {
    app.listen(openopps.port);
    console.log('App running at ' + openopps.hostName);
  }
};
