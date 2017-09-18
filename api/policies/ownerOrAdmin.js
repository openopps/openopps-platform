/**
* Only allow owners or admins to pass through
*/

module.exports = function ownerOrAdmin (req, res, next) {
  // check if owner of the task
  if (req.isOwner ||
      ( req.body.taskId && req.body.taskId.isOwner ) ||
      req.user.isAdmin) {
    return next();
  }
  // Otherwise not allowed.
  return res.forbidden('Not authorized');
};
