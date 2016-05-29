/**
* Only allow admin to pass through
*/
module.exports = function(req, res, next) {
  if (req.user && (req.user.isAdmin || req.user.isAgencyAdmin )) {
    return next();
  }
  // Otherwise not allowed.
  return res.forbidden('Not authorized');
};
