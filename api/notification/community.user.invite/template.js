module.exports = {
  subject: 'Welcome to the <%- community.communityName %> community',
  to: '<%= user.governmentUri ? user.governmentUri : user.username %>',
  data: function (model, done) {
    var data = {
      user: model.user,
      community: model.community,
      admin: model.admin,
    };
    done(null, data);
  },
};
