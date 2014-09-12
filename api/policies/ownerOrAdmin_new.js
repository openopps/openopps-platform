/**
* Only allow owners or admins to pass through
*/

var _ = require('underscore');

module.exports = function addUserId (req, res, next) {
  //todo actual isOwner checks for comments,discussions & events

  if (req.isOwner || req.user[0].isAdmin) {
    return next();
  }

  // Otherwise not allowed.
  return res.send(403, { message: "Not authorized." });
};