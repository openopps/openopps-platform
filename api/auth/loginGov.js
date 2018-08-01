// Openid-Client instantiation to use Login.gov SSO
const { Issuer } = require('openid-client');
const log = require('log')('app:oidc:LoginGov');

module.exports = new Promise(async (resolve) => { 
  var issuer = await Issuer.discover(openopps.auth.loginGov.discoveryURL).catch(err => {
    log.error('Unable to discover issuer', err);
    return null;
  });
  if(issuer) {
    resolve(new issuer.Client({
      client_id: openopps.auth.loginGov.clientID,
      client_secret: openopps.auth.loginGov.clientSecret,
    }));
  } else {
    resolve(null);
  }
});