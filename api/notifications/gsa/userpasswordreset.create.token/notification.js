module.exports = {

  subject: 'Reset your password on <%- globals.systemName %>',

  to: '<%= user.username %>',

  /*
  * Prepares the data object to render templates
  * @param {Notification} notification model
  * @param {function} callback called with err, data
  * data.globals defaults to sails.config
  */
  data: function(model, done) {
    var data = {
          user: {},
          link: '/profile/reset/' + model.token
        };

    User.findOne({ id: model.userId }).exec(function(err, user) {
      if (err) return done(err);
      data.user = user;
      done(null, data);
    });
  }
};
