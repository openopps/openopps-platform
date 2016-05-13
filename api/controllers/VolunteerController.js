/**
 * VolunteerController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  create: function (req, res) {
    var v = _.extend(req.body || {}, req.params);
    if (v.silent) v.silent = JSON.parse(v.silent);
    Volunteer.createAction(v)
    .then(function(newVolunteer) {
      return res.send(newVolunteer);
    })
    .catch(function(err) {
      sails.log.error('VolunteerController.create (err attrs):', err, v);
      return res.send(400, { message: 'Error creating volunteer entry' });
    });
  }

};
