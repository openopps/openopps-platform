const fs = require('fs');
const log = require('log')('app:notification:service');
const nodemailer = require('nodemailer');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');
const schedules = require('./schedules');
const systemSetting = require('../admin/systemSetting');
const protocol = openopps.emailProtocol || '';
var transportConfig = openopps[protocol.toLowerCase()] || {};

if (protocol == '') {
  transportConfig = {
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  };
}

function checkEmailThrottle (index, limit) {
  return new Promise(resolve => {
    if((index + 1) % limit == 0) {
      setTimeout(resolve, 1500);
    } else {
      resolve();
    }
  });
}

function createNotification (notification) {
  var path = __dirname + '/' + notification.action + '/template';
  var template = require(path);

  template.data(notification.model, async function (err, data) {
    if (err) {
      log.info(err);
      return done(err);
    }
    data._action = notification.action;
    data._layout = notification.layout || 'layout.html';
    data.moment = require('moment');
    data.globals = {
      httpProtocol: openopps.httpProtocol,
      hostName: openopps.hostName,
      urlPrefix: notification.model.urlprefix || openopps.httpProtocol + '://' + openopps.hostName,
      systemName: notification.model.systemname || openopps.systemName,
      systemEmail: openopps.systemEmail,
      googleAnalytics: openopps.googleAnalytics,
      logo: notification.model.logo,
      participantSurvey: (await systemSetting.get('participantSurveyURL')).value,
      creatorSurvey: (await systemSetting.get('creatorSurveyURL')).value,
    };

    renderTemplate(template, data, function (err, options) {
      if (err) {
        log.info(err);
        return;
      }
      sendEmail(options, function (err, info) {
        log.info(err ? err : info);
        if (!err) {
          insertNotification(data._action, data);
        }
      });
    });
  });
}

function renderTemplate (template, data, done) {
  var html = __dirname + '/' + data._action + '/template.html';
  var layout = __dirname + '/' + data._layout;
  var mailOptions = {
    to: _.template(template.to)(data),
    cc: _.template(template.cc)(data),
    bcc: _.template(template.bcc)(data),
    subject: _.template(template.subject)(data),
  };
  fs.readFile(html, function (err, htmlTemplate, htmlCommunityLogo) {
    if (err) {
      log.info(err);
      return done(err);
    }
    data._content = _.template(htmlTemplate)(data);
    if (!_.isEmpty(template.includes)) {
      data._content += _.map(template.includes, (include) => {
        return renderIncludes(include, data);
      });
    }
    data._communityLogoContent = data.task && data.task.community && (data.task.community.community_type == 3) ? _.template(htmlCommunityLogo)(data) : '';
    if (!_.isEmpty(template.includes)) {
      data._content += _.map(template.includes, (include) => {
        return renderCommunityLogoIncludes(include, data);
      });
    }
    data._emailSignature = data.task && data.task.community && data.task.community.email_signature ? data.task.community.email_signature : 'The ' + data.globals.systemName + ' Team';
    data._logo = data.globals && data.globals.logo || '/img/logo/png/open-opportunities-email.png';
    fs.readFile(layout, function (err, layout) {
      if (err) {
        log.info(err);
        return done(err);
      }
      mailOptions.html = _.template(layout)(data);
      return done(err, mailOptions);
    });
  });
}

function renderIncludes (template, data) {
  try {
    var html = __dirname + '/' + template + '/template.html';
    var htmlTemplate = fs.readFileSync(html);
    return _.template(htmlTemplate)(data);
  } catch (err) {
    return '';
  }
}

function renderCommunityLogoIncludes (template, data) {
  try {
    var html = __dirname + '/communityLogoLayout.html';
    var htmlTemplate = fs.readFileSync(html);
    return _.template(htmlTemplate)(data);
  } catch (err) {
    return '';
  }
}

function sendEmail (mailOptions, done) {
  mailOptions.from = openopps.systemName + ' <' + openopps.systemEmail + '>';
  if (openopps.notificationsCC) mailOptions.cc = _.compact([
    mailOptions.cc,
    openopps.notificationsCC,
  ]);
  if (openopps.notificationsBCC) mailOptions.bcc = _.compact([
    mailOptions.bcc,
    openopps.notificationsBCC,
  ]);

  log.info('Sending SMTP message', mailOptions);
  nodemailer.createTransport(transportConfig).sendMail(mailOptions, function (err, info) {
    if (err) {
      log.info('Failed to send mail. If this is unexpected, please check your email configuration in config/email.js.', err);
      log.info('TransportConfig', transportConfig);
    }
    if (done) {
      return done(err, info);
    }
  });
}

function insertNotification (action, data) {
  var newNotification = {
    action: action,
    model: data,
    isActive: 't',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  dao.Notification.insert(newNotification);
}

function processNotification (notification) {
  switch (notification.notificationType) {
    case 'Bounce':
      if(notification.bounce.bounceType == 'Permanent') {
        _.forEach(notification.bounce.bouncedRecipients, (recipient) => {
          dao.User.findOne('username = ?', recipient.emailAddress.toLowerCase()).then((user) => {
            user.bounced = true;
            user.updatedAt = new Date();
            dao.User.update(user);
            insertAWSNotification({
              type: notification.notificationType,
              subType: notification.bounce.bounceType,
              data: notification,
              userId: user.id,
              createdAt: new Date(),
            });
          }).catch((err) => {
            log.info('Error processing bounce notification for email ' + recipient.emailAddress);
          });
        });
      }
      break;
    case 'Complaint':
      _.forEach(notification.complaint.complainedRecipients, (recipient) => {
        dao.User.findOne('username = ?', recipient.emailAddress.toLowerCase()).then((user) => {
          user.complained = _.indexOf(['abuse', 'fraud'], notification.complaint.complaintFeedbackType);
          user.updatedAt = new Date();
          dao.User.update(user);
          insertAWSNotification({
            type: notification.notificationType,
            subType: notification.complaint.complaintFeedbackType,
            data: notification,
            userId: user.id,
            createdAt: new Date(),
          });
        }).catch((err) => {
          log.info('Error processing complaint notification for email ' + recipient.emailAddress);
        });
      });
      break;
    default:
      break;
  }
}

function insertAWSNotification (notification) {
  dao.NotificationMonitor.insert(notification).catch(err => {
    log.info('Error inserting AWS notification ' + notification.type, err);
  });
}

function runSchedule (scheduleRequest) {
  schedules.getJob(scheduleRequest.job).getNotificationData().then(async results => {
    for(let i = 0; i < results.length; i++) {
      createNotification(results[i]);
      await checkEmailThrottle(i, 20);
    }
  }).catch(err => {
    log.error(err);
  });
}

function listSchedules () {
  return schedules.listJobs();
}

module.exports = {
  checkEmailThrottle: checkEmailThrottle,
  createNotification: createNotification,
  processNotification: processNotification,
  insertAWSNotification: insertAWSNotification,
  runSchedule: runSchedule,
  listSchedules: listSchedules,
};
