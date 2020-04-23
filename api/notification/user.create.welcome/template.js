module.exports = {
  subject: 'Welcome to <%= globals.systemName %>!',
  to: '<%= user.governmentUri ? user.governmentUri : user.username %>',
  data: function (model, done) {
    var data = {
      user: model,
    };
    done(null, data);
  },
};
