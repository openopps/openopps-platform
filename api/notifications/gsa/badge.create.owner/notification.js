module.exports = {

  subject: 'You earned a new badge',

  to: '<%= user.username %>',

  /*
  * Prepares the data object to render templates
  * @param {Notification} notification model
  * @param {function} callback called with err, data
  * data.globals defaults to sails.config
  */
  data: function(data, done) {
    done(null, data);
  }
};
