/**
* Only allow admin to pass through
*/

module.exports = function(req, res, next) {
  // check if owner of the project or task
  if (req.user && req.user.isAdmin) {
    return next();
  }
  // Otherwise not allowed.
  return res.forbidden('Not authorized');
};
