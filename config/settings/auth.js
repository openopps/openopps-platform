module.exports = {
  // AUTHENTICATION SETTINGS
  // Set your client ids private keys for each of your services
  auth: {
    local : {
      // number of attempts before locking out the user
      passwordAttempts : 5,
      // expire password reset tokens after this many milliseconds
      tokenExpiration  : 60 * 60 * 1000,
    },
    loginGov : {
      enabled: (process.env.LOGINGOV || '').match(/^true$/i) || false,
      logoutURL: process.env.LOGOUT_URL,
      discoveryURL: process.env.DISCOVERY_URL,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    },
    profileURL: process.env.PROFILE_URL,
  },
};
