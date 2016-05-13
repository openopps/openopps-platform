/**
* Require the user to be logged in.
*/

module.exports = function requireAuth(req, res, next) {
  sails.log.verbose('requireUserAuth policy, req.user: ', req.user);
  if (!req.user) {
    return res.forbidden('Not authorized');
  }
  next();
};
