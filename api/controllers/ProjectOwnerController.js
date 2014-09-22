/**
 * ProjectOwnerController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var _ = require('underscore');
var projUtils = require('../services/utils/project');

module.exports = {

  create: function (req, res) {
    // Look up project
    var params = _.extend(req.body || {}, req.params);
    if ((_.isUndefined(params.userId)) || (_.isUndefined(params.projectId))) {
      return res.send(400, { message: 'Must specify both userId and projectId. '});
    }
    ProjectOwner.findOne({ projectId: params.projectId, userId: params.userId }, function (err, origOwner) {
      if (err) { return res.send(400, { message: 'Error finding project owners.' } ); }
      if (origOwner) {
        // owner already exists, abort
        return res.send(origOwner);
      }
      // create new owner
      ProjectOwner.create(params, function (err, owner) {
        if (err) { return res.send(400, { message: 'Error creating owner.' } ); }
        return res.send(owner);
      });
    });
  },

  destroy: function(req, res) {
    // DESTROY should be called with /projectowner/destory/:id
    // where id is the **projectOwner** id (not the projectId and not the userId)
    ProjectOwner.findOneById(req.route.params.id, function (err, proj) {
      if (err) { return res.send(400, { message: 'Error finding project owner.' } ); }
      projUtils.authorized(proj.projectId, req.user[0].id, function (err, p) {
        if (err) { return res.send(400, { message: err }); }
        if (!err && !p) { return res.send(403, { message: 'Not authorized.'}); }
        // delete owner object
        proj.destroy(function (err) {
          if (err) { return res.send(400, { message: 'Error destroying owner.' } ); }
          return res.send({ message: 'Operation successful.'});
        });
      });
    });
  },

  findAllByProjectId: function (req, res) {
    ProjectOwner.findByProjectId(req.route.params.id, function (err, proj) {
      if (err) { return res.send(400, { message: 'Error finding project owners.' } ); }
      return res.send(proj);
    });
  }

};
