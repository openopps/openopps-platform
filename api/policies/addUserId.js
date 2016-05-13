/**
* Add userId into params or body for knowing who created them.
*/
var _ = require('underscore');

module.exports = function addUserId (req, res, next) {
  if (req.user) {
    // if this request is sending an object in the body
    // add in the user's id which will identify object owner/creator
    if (!_.isEmpty(req.body)) {
      if (!req.user.isAdmin || (req.user.isAdmin && !req.body.userId)) {
        req.body.userId = req.user.id;
      }
    } else {
      // If not, add the logged in user to the parameters
      req.params.userId = req.user.id;
    }
  }
  next();
};
