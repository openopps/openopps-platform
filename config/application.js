console.log('Loading... ', __filename);

module.exports = {

  // The name of the system, as should appear in emails and the <html> <title> tag
  systemName: process.env.SYSTEM_NAME || 'midas',

  // 'http' or 'https'
  httpProtocol: process.env.PROTOCOL || 'http',

  // hostName defines the domain upon which your app will be deployed (e.g. 'localhost:1337', for development)
  hostName: process.env.HOST || 'localhost:1337',

  // The `port` setting determines which TCP port your app will be deployed on
  // Ports are a transport-layer concept designed to allow many different
  // networking applications run at the same time on a single computer.
  // More about ports: http://en.wikipedia.org/wiki/Port_(computer_networking)
  //
  // By default, if it's set, Sails uses the `PORT` environment variable.
  // Otherwise it falls back to port 1337.
  //
  // In production, you'll probably want to change this setting
  // to 80 (http://) or 443 (https://) if you have an SSL certificate
  // port: process.env.PORT || 1337,

  // The runtime "environment" of your Sails app is either 'development' or 'production'.
  //
  // In development, your Sails app will go out of its way to help you
  // (for instance you will receive more descriptive error and debugging output)
  //
  // In production, Sails configures itself (and its dependencies) to optimize performance.
  // You should always put your app in production mode before you deploy it to a server-
  // This helps ensure that your Sails app remains stable, performant, and scalable.
  //
  // By default, Sails sets its environment using the `NODE_ENV` environment variable.
  // If NODE_ENV is not set, Sails will run in the 'development' environment.
  // environment: process.env.NODE_ENV || 'development'

  // import client configuration
  ui: require(process.cwd() + '/assets/js/backbone/config/ui.json'),

  // survey to send out after task is complete
  survey: process.env.SURVEY_LINK,

  // token to validate cron request is internal
  cron_token : process.env.CRON_TOKEN || 'cron_token',

  // Default task state
  taskState: process.env.TASK_STATE || 'draft',
  draftAdminOnly: process.env.DRAFT_ADMIN_ONLY || false,

  validateDomains: process.env.VALIDATE_DOMAINS || false,
  requireAgency:   process.env.REQUIRE_AGENCY || false,
  requireLocation: process.env.REQUIRE_LOCATION || false

};

if (module.exports.httpProtocol === 'https') {
  // Use secure sessions
  module.exports.session =  {
    proxy: true,
    cookie: {
      secure: true
    }
  };
}

module.exports.appUrl = module.exports.httpProtocol + '://' + module.exports.hostName;
