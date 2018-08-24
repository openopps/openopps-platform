module.exports = {
  subject: 'Confirm your account on <%- globals.systemName %>',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      user: model.user,
      link: '/api/auth/link?h=' + model.hash,
    };
    done(null, data);
  },
};
