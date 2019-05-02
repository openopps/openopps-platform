module.exports = {
  subject: 'Find my <%- globals.systemName %> Profile',
  to: '<%= user.uri %>',
  data: function (model, done) {
    var data = {
      user: model.user,
      link: '/api/auth/link?h=' + model.hash,
    };
    done(null, data);
  },
};
