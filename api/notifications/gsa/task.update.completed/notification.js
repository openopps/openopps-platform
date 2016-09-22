module.exports = {

  subject: '<%- task.title %> is complete — thank you!',

  to: '<%- volunteers %>',

  cc: '<%- owner.username %>',

  /*
  * Prepares the data object to render templates
  * @param {Notification} notification model
  * @param {function} callback called with err, data
  * data.globals defaults to sails.config
  */
  data: function(model, done) {
    var data = {
          task: model,
          owner: {},
          volunteers: '',
          survey: sails.config.survey
        };
    User.findOne( { id: model.owner } ).exec( function ( err, owner ) {
      if (err) return done(err);
      data.owner = owner;

      Volunteer.find({ taskId: model.id }).exec(function(err, volunteers) {
        if (err) return done(err);
        var userIDs = _.pluck(volunteers, 'userId');

        User.find({ id: userIDs }).exec(function(err, users) {
          data.volunteers = _.pluck(users, 'username').join(', ');
          done(null, data);
        });

      });

    });
  }
};
