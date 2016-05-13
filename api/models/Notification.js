/**
 * Notification
 *
 * @module      :: Model
 * @description :: A representation of a user-directed message
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
 var fs = require('fs'),
     nodemailer = require('nodemailer'),
     protocol = sails.config.emailProtocol,
     transportConfig = sails.config[protocol.toLowerCase()];

module.exports = {

  attributes: {

    // Notification action name
    action: 'string',

    // JSON data of the calling model
    model: 'json',

    // ID of caller entity
    callerId: 'INTEGER',
    // type of caller entity
    callerType: 'STRING',
    // GUID of action trigger
    triggerGuid: 'STRING',
    // name of intended audience
    audience: 'STRING',
    // ID of user to whom the notification is directed
    recipientId: 'INTEGER',
    // Timestamp of creation
    createdDate: 'DATETIME',
    // JSON object representing local data needed to process the notification into a delivery
    localParams: 'STRING',
    // JSON object representing global data needed to process the notification into a delivery
    globalParams: 'STRING',
    // Future soft-delete functionality
    isActive: {
      'type': 'BOOLEAN',
      'defaultsTo': true,
    }

  },

  afterCreate: function (model, done) {

    // Trigger a notification message
    this.trigger(model);

    // Send notification asynchronously
    done();

  },

  /*
    Trigger a notification
    @param {string} name of notification (should match folder name)
    @param {object} model triggering the notification
    @param {sting} the triggering model's type
  */
  trigger: function(notification, done) {
    if (typeof done === "undefined") done = function() {};
    // Send mail over SMTP with node-mailer
    if (protocol === '') {
      sails.log.info('email OFF, would have sent:', notification);
      return done(null);
    } else {
      sails.log.debug( notification );      
    }

    // Get notification script
    var path = __dirname + '/../notifications/' +
          notification.action + '/notification',
        template = require(path);

    // Populate notification data
    template.data(notification.model, function (err, data) {
      if (err) sails.log.error(err);
      if (err) return done(err);

      // Set notification action on the data object
      data._action = notification.action;

      // Extend with sails config
      data.globals = {
        httpProtocol: sails.config.httpProtocol,
        hostName: sails.config.hostName,
        urlPrefix: sails.config.httpProtocol + "://" + sails.config.hostName,
        systemName: sails.config.systemName
      };

      // Render and send notification
      Notification.render(template, data, function (err, options) {
        if (err) return done(err);
        Notification.send(options, function (err, info) {
          if (err) sails.log.error(err);
          if (info) sails.log.info(info);
          return done(err, info);
        });
      });

    });

  },

  // Render a notification's templates
  render: function (template, data, done) {

    // Set up mail headers
    var html = __dirname + '/../notifications/' +
          data._action + '/template.html',
        layout = __dirname + '/../notifications/layout.html',
        mailOptions = {
          to: _.template(template.to)(data),
          cc: _.template(template.cc)(data),
          bcc: _.template(template.bcc)(data),
          subject: _.template(template.subject)(data)
        };

    // Template html content
    fs.readFile(html, function (err, template) {
      if (err) sails.log.error(err);
      if (err) return done(err);
      data._content = _.template(template)(data);

      // Inject template html into layout
      fs.readFile(layout, function (err, layout) {
        if (err) sails.log.error(err);
        mailOptions.html = _.template(layout)(data);
        return done(err, mailOptions);
      });
    });
  },

  // Send an email
  send: function (options, done) {

    // Extend options with config defaults
    options.from = sails.config.systemName +
      ' <' + sails.config.systemEmail + '>';
    if (sails.config.notificationsCC) options.cc = _.compact([
      options.cc,
      sails.config.notificationsCC
    ]);
    if (sails.config.notificationsBCC) options.bcc = _.compact([
      options.bcc,
      sails.config.notificationsBCC
    ]);

    sails.log.info('Sending SMTP message', options);
    this._transport.sendMail(options, function (err, info) {
      if (err) sails.log.error('Failed to send mail. If this is unexpected, ' +
        'please check your email configuration in config/local.js.', err);
      if (done) return done(err, info);
    });
  },

  // Mailer transport
  _transport: nodemailer.createTransport(transportConfig)

};
