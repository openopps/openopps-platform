// Openid-Client instantiation to use Login.gov SSO
const { Issuer } = require('openid-client');
const log = require('log')('app:oidc:LoginGov');

module.exports = new Promise(async (resolve) => { 
  var issuer = await Issuer.discover(openopps.auth.loginGov.discoveryURL).catch(err => {
    log.error('Unable to discover issuer', err);
    return null;
  });
  if(issuer) {
    var client = new issuer.Client({
      client_id: openopps.auth.loginGov.clientID,
      client_secret: openopps.auth.loginGov.clientSecret,
    });
    client.CLOCK_TOLERANCE = 300; // to allow a 300s (5m) skew
    resolve(client);
  } else {
    resolve(null);
  }
});