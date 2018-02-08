module.exports = {

  subject: 'Welcome to <%= globals.systemName %>',

  to: '<%= user.username %>',

  /*
  * Prepares the data object to render templates
  * @param {Notification} notification model
  * @param {function} callback called with err, data
  * data.globals defaults to sails.config
  */
  data: function(model, done) {
    var data = { user: model };
    done(null, data);
  }
};
