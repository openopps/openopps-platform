/**
* Determines whether the logged in user owns this comment
*/
module.exports = function comment (req, res, next) {

  Comment.findOneById(req.params.id, function (err, c) {
    if (err || !c) { return res.send(400, { message: 'Error finding comment'}); }

    // Volunteer must be owned by the user (used by ownerOrAdmin() )
    req.isOwner = (c.userId == req.user.id);
    return next();
  });
};
