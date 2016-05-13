// import login configuration
var config = require(process.cwd() + '/assets/js/backbone/config/login.json');
module.exports = {
  // AUTHENTICATION SETTINGS
  // Set your client ids private keys for each of your services
  auth: {
    local : {
      // number of attempts before locking out the user
      passwordAttempts : 5,
      // expire password reset tokens after this many milliseconds
      tokenExpiration  : 60*60*1000
    },
    myusa : {
      overwrite   : false
    }
  },
  // Pass the login.json config object to sails
  config: config
};
