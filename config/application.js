console.log('Loading... ', __filename);

module.exports = {

  // The name of the system, as should appear in emails and the <html> <title> tag
  systemName: process.env.SYSTEM_NAME || 'Open Opportunities',

  // 'http' or 'https'
  httpProtocol: process.env.PROTOCOL || 'http',

  // hostName defines the domain upon which your app will be deployed (e.g. 'localhost:1337', for development)
  hostName: process.env.HOST || 'localhost:3000',

  // redirect domain not matching hostName
  redirect: (process.env.REDIRECT || '').match(/^true$/i) || false,

  // The `port` setting determines which TCP port your app will be deployed on
  // Ports are a transport-layer concept designed to allow many different
  // networking applications run at the same time on a single computer.
  // More about ports: http://en.wikipedia.org/wiki/Port_(computer_networking)
  //
  // By default, if it's set, the application uses the `PORT` environment variable.
  // Otherwise it falls back to port 3000.
  //
  // In production, you'll probably want to change this setting
  // to 80 (http://) or 443 (https://) if you have an SSL certificate
  port: process.env.PORT || 3000,

  // survey to send out after task is complete
  survey: process.env.SURVEY_LINK,

  // token to validate cron request is internal
  cron_token : process.env.CRON_TOKEN || 'cron_token',

  // Default task state
  taskState: process.env.TASK_STATE || 'draft',
  draftAdminOnly: (process.env.DRAFT_ADMIN_ONLY || '').match(/^true$/i) || false,

  validateDomains: (process.env.VALIDATE_DOMAINS || '').match(/^true$/i) || false,
  requireAgency:   (process.env.REQUIRE_AGENCY || '').match(/^true$/i) || false,
  requireLocation: (process.env.REQUIRE_LOCATION || '').match(/^true$/i) || false,
};

module.exports.appUrl = module.exports.httpProtocol + '://' + module.exports.hostName;
