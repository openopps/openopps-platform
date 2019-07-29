module.exports = {
  subject: 'You earned a new badge',
  to: '<%= user.governmentUri ? user.governmentUri : user.username %>',
  data: function (data, done) {
    done(null, data);
  },
};
