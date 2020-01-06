module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) - Internship location has changed',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      user: model.user,
    };
    done(null, data);
  },
};
  