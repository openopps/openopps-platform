/**
* Require the user to be logged in.
*/

module.exports = function requireAuth(req, res, next) {
  sails.log.verbose('requireAuth policy, req.user: ', req.user);
  if (!req.user) {
    return res.forbidden('Not authorized');
  }
  next();
};
