module.exports = {
  subject: 'Your review board is now closed.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      given_name: model.given_name,
      archivelink: model.agencyportallink,
    };
    done(null, data);
  },
};
