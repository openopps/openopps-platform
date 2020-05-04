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

module.exports.sendCommentNotification = async function (user, comment, action) {
  var notificationData = (await dao.Comment.db.query(dao.query.commentQuery, comment.id)).rows;
  var data = {
    action: action,
    model: {
      comment: { id: notificationData[0].commentid, value: notificationData[0].value },
      commenter: { id: user.id, name: user.name },
      task: { id: notificationData[0].taskid, title: notificationData[0].tasktitle },
      owner: { name: notificationData[0].ownername, username: notificationData[0].ownerusername, governmentUri: notificationData[0].ownergovernmenturi },
    },
  };
  if(!notificationData[0].ownerbounced) {
    notification.createNotification(data);
  }
};
