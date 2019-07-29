module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) – Please complete a survey',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      user: model.user,
    };
    done(null, data);
  },
};
