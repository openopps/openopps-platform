/**
* Check that the :id parameter matches logged in user
*/

module.exports = function user (req, res, next) {
  if (req.user && req.user.isAdmin) {
    //admins are allowed to do anything
    return next();
  } else {
    if (req.route.params.id == req.user.id) {
      //allow the currently logged in user to access themselves
      return next();
    } else {
      //dissallow a user due to ID mismatch
      return res.send(403, { message: 'Not authorized'});
    }
  }
};
