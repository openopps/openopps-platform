module.exports = {

  // Is New Relic configured for this server?
  newrelicEnabled: false,

  // The contents of the newrelic.js configuration file goes here.
  newrelic: {
    // Array of application names, as they will appear in the New Relic interface.
    app_name : ['midas'],
    // Your New Relic license key.
    license_key : 'license key',
    logging : {
      /**
       * Level at which to log. 'trace' is most useful to New Relic when diagnosing
       * issues with the agent, 'info' and higher will impose the least overhead on
       * production applications.
       */
      level : 'info'
    }
  }

};
