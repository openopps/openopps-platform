/**
* Only Admins should be able to UPDATE the isAdmin and isAgencyAdmin properties
* of the model.  All other references to isAdmin and isAgencyAdmin should be
* scrubbed.
*/
module.exports = function protectAdmin (req, res, next) {
  if ( !(req.user && req.user[0].isAdmin) ) {
    delete req.body.isAdmin;
    delete req.body.isAgencyAdmin;
  }
  next();
};
