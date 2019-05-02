module.exports = {
  subject: 'Welcome to the <%- community.communityName %> community',
  to: '<%- user.uri %>',
  data: function (model, done) {
    var data = {
      user: model.user,
      community: model.community,
      admin: model.admin,
    };
    done(null, data);
  },
};
