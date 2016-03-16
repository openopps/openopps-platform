var _ = require('underscore');
/**
* Check whether user is admin or agency admin for the agency requested
*/
module.exports = function admin (req, res, next) {
  // Check the user is logged in and is an admin
  if (!req.user) {
    return res.send(403, "You must login as an admin or agency admin to perform this action.");
  }
  if (req.user[0].isAdmin) {
    return next();
  }
  var userAgency = _.findWhere(req.user[0].tags, { type: 'agency' });
  var userAgencyId = userAgency.id;
  var requestedAgencyId = req.route.params.id;
  if (requestedAgencyId == userAgencyId) {
    return next();
  }
  return res.send(403, "You must login as an admin or agency admin to perform this action.");
};

