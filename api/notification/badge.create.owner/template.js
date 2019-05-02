module.exports = {
  subject: 'You earned a new badge',
  to: '<%= user.uri %>',
  data: function (data, done) {
    done(null, data);
  },
};
