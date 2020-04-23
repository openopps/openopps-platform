console.log('Loading... ', __filename);

var fs = require('fs');

const isSecure = function () {
  if ( process.env.EMAIL_SSL === 'false' ) {
    return false;
  }
  return true;
};

module.exports = {
  AWS_ACCOUNT: process.env.AWS_ACCOUNT || '',

  NOTIFICATION_API_KEY: process.env.NOTIFICATION_API_KEY,

  // Email dispatch protocol
  // (for now only SMTP, but NodeMailer supports other transports with plugins)
  // easy to create additional configurations
  emailProtocol: 'smtp',

  // SMTP Mail settings -- uses Nodemailer
  // See for more config options: https://github.com/andris9/Nodemailer#setting-up-smtp
  // SMTP Mail settings -- uses Nodemailer
  // See for more config options: https://github.com/andris9/Nodemailer#setting-up-smtp
  smtp: {
    // remote SMTP host
    host                : process.env.EMAIL_HOST || '',
    // true to use SSL connections
    secure              : isSecure(),
    // 25 (non-secure) or 465 (secure)
    port                : JSON.parse(process.env.EMAIL_PORT || 465),
    // username and password settings for secure connections
    auth                : {
      user              : process.env.EMAIL_USER || '',
      pass              : process.env.EMAIL_PASS || '',
    },
    // ignore server support for STARTTLS (defaults to false)
    ignoreTLS           : JSON.parse(process.env.EMAIL_IGNORE_TLS || false),
    // output client and server messages to console
    debug               : JSON.parse(process.env.EMAIL_DEBUG || false),
    pool                : true,
    // how many connections to keep in the pool (defaults to 5)
    maxConnections      : 5,
    // limit the count of messages to send through a single connection (defaults to 100)
    // maxMessages         :
  },

  // Google Analytics
  googleAnalytics: {
    enabled: JSON.parse(process.env.GOOGLE_ANALYTICS || false),
    account: process.env.GOOGLE_ANALYTICS_ACCOUNT,
    category: process.env.GOOGLE_ANALYTICS_EMAIL_CATEGORY || 'email',
  },

  // system email address (from address)
  systemEmail: process.env.EMAIL_SYSTEM_ADDRESS || 'example@example.com',

  notificationsCC  : process.env.NOTIFICATIONS_CC || '',
  notificationsBCC : process.env.NOTIFICATIONS_BCC || '',

};
