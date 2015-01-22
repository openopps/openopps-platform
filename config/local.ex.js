/**
 * Local environment settings
 *
 * While you're developing your app, this config file should include
 * any settings specifically for your development computer (db passwords, etc.)
 * When you're ready to deploy your app in production, you can use this file
 * for configuration options on the server where it will be deployed.
 *
 *
 * PLEASE NOTE:
 *    This file is included in your .gitignore, so if you're using git
 *    as a version control solution for your Sails app, keep in mind that
 *    this file won't be committed to your repository!
 *
 *    Good news is, that means you can specify configuration for your local
 *    machine in this file without inadvertently committing personal information
 *    (like database passwords) to the repo.  Plus, this prevents other members
 *    of your team from commiting their local configuration changes on top of yours.
 *
 *
 * For more information, check out:
 * http://sailsjs.org/#documentation
 */
var fs = require('fs'),
    pgSession = require('connect-pg-simple'),
    express = require('sails/node_modules/express'),
    pg = require('sails-postgresql/node_modules/pg'),
    local;

local = {
  // The name of the system, as should appear in emails and the <html> <title> tag
  systemName: 'midas',
  // 'http' or 'https'
  httpProtocol: 'http',
  // hostName defines the domain upon which your app will be deployed (e.g. 'localhost:1337', for development)
  hostName: 'localhost:1337',
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

  port: process.env.PORT || 1337,

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

  environment: process.env.NODE_ENV || 'development',

  // POSTGRES
  // Set your postgres database settings here, including the username, password
  // and database name
  connections: {
    'default': process.env.ADAPTER_DEFAULT || 'postgresql',
    memory: {
      adapter: 'sails-disk',
      inMemory: true
    },
    disk: {
      adapter: 'sails-disk',
      filePath: './.tmp/',
      inMemory: false
    },
    postgresql: {
      adapter     : 'sails-postgresql',
      host        : 'localhost',
      user        : 'midas',
      password    : 'midas',
      database    : 'midas',
      softDelete  : true
    }
  },

  // Email Templating settings
  emailTemplateDirectories: {
    templateDir: 'assets/email/templates',
    layoutDir: 'assets/email/layouts'
  },

  // Email dispatch protocol (i.e. SMTP  or SES)
  emailProtocol: 'SMTP',
  // SMTP Mail settings -- uses Nodemailer
  // See for more config options: https://github.com/andris9/Nodemailer#setting-up-smtp
  smtp: {
    // Specify to use a supported service; leave blank for SMTP
    // See: https://github.com/andris9/Nodemailer#well-known-services-for-smtp
    service             : '',
    // remote SMTP host
    host                : '',
    // true to use SSL connections
    secureConnection    : true,
    // 25 (non-secure) or 465 (secure)
    port                : 465,
    // username and password settings for secure connections
    auth                : {
      user              : '',
      pass              : ''
    },
    // ignore server support for STARTTLS (defaults to false)
    ignoreTLS           : false,
    // output client and server messages to console
    debug               : false,
    // how many connections to keep in the pool (defaults to 5)
    maxConnections      : 5
    // limit the count of messages to send through a single connection (no limit by default)
    // maxMessages         :
  },

  // SES Mail settings -- uses Nodemailer
  ses: {
    // AWSAccessKeyID: 'AWSACCESSKEY',
    // AWSSecretKey: 'AWS/Secret/key',
    // ServiceUrl: 'https://email.us-east-1.amazonaws.com'
  },

  // is DKIM signing enabled for Nodemailer transport?
  dkimEnabled: false,
  // DKIM signing options for Nodemailer transport
  dkim: {
    // domainName: "kreata.ee",
    // keySelector: "dkim",
    // privateKey: fs.readFileSync("private_key.pem"),
    // headerFieldNames: ''
  },

  // system email address (from address)
  systemEmail: 'test@midas.com',

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

// Use main postgres database for sessions
local.session = {
  store: new (pgSession(express.session))({
    conString: local.connections.postgresql,
    pg: pg
  })
};

module.exports = local;
