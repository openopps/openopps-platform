const _ = require ('lodash');
const log = require('log')('app:comment:service');
const db = require('../../db/client');
const dao = require('./dao')(require('../../db'));
const notification = require('../notification/service');
const fs = require('fs');

module.exports = {};

module.exports.addComment = function (attributes, done) {
  var creation = new Date();
  return db.query({
    text: `INSERT INTO comment
      (topic, "projectId", "taskId", "parentId", "userId", value, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `,
    values: [attributes.topic, attributes.projectId, attributes.taskId, attributes.parentId, attributes.userId, attributes.value, creation, creation],
  });
};

module.exports.findById = async function (id) {
  return await dao.Comment.findOne('id = ?', id).then((comment) => {
    return comment;
  }).catch(err => {
    log.info('Cannot find comment by id ' + id, err);
    return null;
  });
};

module.exports.commentsForTask = function (taskId) {
  return new Promise(resolve => {
    db.query({
      text: fs.readFileSync(__dirname + '/sql/getCommentsByTaskId.sql', 'utf8'),
      values: [taskId],
    }).then(results => {
      resolve(results.rows);
    }).catch(err => {
      log.error(err);
      resolve([]);
    });
  });
};

module.exports.deleteComment = async function (id) {
  await dao.Comment.delete('id = ?', id).then(async (task) => {
    return id;
  }).catch(err => {
    log.info('delete: failed to delete task ', err);
    return false;
  });
};

module.exports.sendCommentNotification = async function (user, comment) {
  db.query({
    text: fs.readFileSync(__dirname + '/sql/getCommentNotificationData.sql', 'utf8'),
    values: [comment.id],
  }).then(async results => {
    var data = results.rows[0];
    if(data.owner.id != data.commenter.id) {
      if (data.owner.bounced) {
        log.info('Cannot email %s because this email has resulted in a bounce', (data.owner.government_uri || data.owner.username));
      } else {
        notification.createNotification({
          action: 'comment.create.owner',
          model: {
            comment: comment,
            commenter: data.commenter,
            task: { id: comment.taskid, title: data.title },
            owner: data.owner,
          },
        });
      }
    }
    for(let i = 0; i < data.recipients.length; i++) {
      await notification.checkEmailThrottle(i, 15);
      var recipient = data.recipients[i];
      if (recipient.bounced) {
        log.info('Cannot email %s because this email has resulted in a bounce', (recipient.government_uri || recipient.username));
      } else {
        notification.createNotification({
          action: 'comment.create.participant',
          model: {
            comment: comment,
            commenter: data.commenter,
            task: { id: comment.taskid, title: data.title },
            recipient: recipient,
          },
        });
      }
    }
  }).catch(err => {
    log.error(err);
  });
};
