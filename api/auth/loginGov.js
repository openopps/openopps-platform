// Openid-Client instantiation to use Login.gov SSO
const { Issuer } = require('openid-client');
const log = require('log')('app:oidc:LoginGov');

module.exports = (async () => {
  var issuer = await Issuer.discover(openopps.auth.loginGov.discoveryURL);
  log.info('Discovered issuer', issuer);
  return new issuer.Client({
    client_id: openopps.auth.loginGov.clientID,
    client_secret: openopps.auth.loginGov.clientSecret,
  });
})();