const _ = require('lodash');
const dao = require('postgres-gen-dao');

const commentQuery = 'select ' +
'owner.name ownername, owner.username ownerusername, owner.government_uri ownergovernmenturi, owner.bounced ownerbounced, ' +
'comment.id commentid, comment.value, ' +
'task.title tasktitle, task.id taskid ' +
'from comment inner join task on comment."taskId" = task.id ' +
'inner join midas_user owner on task."userId" = owner.id ' +
'where comment.id = ? ';

module.exports = function (db) {
  return {
    Comment: dao({ db: db, table: 'comment' }),
    query: {
      commentQuery: commentQuery,
    },
  };
};
