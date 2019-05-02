module.exports = {
  subject: 'Welcome to <%= globals.systemName %>!',
  to: '<%= user.uri %>',
  data: function (model, done) {
    var data = {
      user: model,
    };
    done(null, data);
  },
};
