var _ = require('underscore');
var async = require('async');
var S = require('string');

/**
 * Gets all the comments given a particular
 * where clause, allowing flexibly fetching
 * comments for different parts of the application,
 * such as projects or task.
 *
 * Example: commentAssemble({ projectId: id }, function (err, comments) { });
 */
var commentAssemble = function (where, done) {
  // Find all topics
  Comment.find()
  // .where({ topic: true })
  .where(where)
  //we sort oldest to newest because we are changing the renderer (which is called for each comment) to prepend instead of append
  .sort({'updatedAt':1})
  .exec(function (err, comments) {
    if (err) return done(err, null);
    console.log('comments', comments);
    var userIds = [];
    for (var i = 0; i < comments.length; i++) {
      if (_.indexOf(userIds, comments[i].userId) == -1) { userIds.push(comments[i].userId); }
    }

    var users = {};
    var getId = function (id, next) {
      User.findOneById(id, function (err, user) {
        if (err) { return next(err); }
        users[id] = user;
        next();
      });
    };

    async.each(userIds, getId, function (err) {
      if (err) return done(err, null);
      // Attach userIds to topics
      console.log('users', users);
      console.log('comments.length', comments.length);
      for (var i = 0; i < comments.length; i++) {
        comments[i].user = { username: users[comments[i].userId].username, name: users[comments[i].userId].name }
      }
      return done(null, comments);
    });
  });
};

// Finds all parent comments recursively
var commentParentThreadAssemble = function(comment, where, done){
  // base case
  if(!comment.parentId){
    done(null, []);
  }
  else {
    var returnMe = [];
    where = where || {};
    where = _.extend(where, { id: comment.parentId });
    // get parent comment
    commentAssemble(where, function(err, result){
      if(!err) {
        if(result && result.length > 0){
          returnMe = result.slice(0);
          var item = result.pop();
          // add parent comment to list
          returnMe.push(item);
          // recursive call on parent
          commentParentThreadAssemble(item, where, function(err, res){
            if(!err){
              returnMe = _.union(returnMe, res);
            }
            done(err, returnMe);
          });
        }
        else {
          done(err, returnMe);
        }
      }
      else {
        done(err, returnMe);
      }
    });
  }
};

// updates a comment so that it can be rendered in email or outside the app
var cleanComment = function (comment) {
  // remove all HTML
  comment = S(comment).stripTags().s;
  // replace non breaking spaces with regular spaces
  comment = comment.replace(/&nbsp;/gi, " ");
  return comment;
};

module.exports = {
  commentAssemble: commentAssemble,
  commentParentThreadAssemble: commentParentThreadAssemble,
  cleanComment: cleanComment
};
