module.exports = {
  subject: 'Your review board is now closed.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      given_name: model.given_name,         
      title: model.title,
    };
    done(null, data);
  },
};
