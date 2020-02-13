module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) - Application period is closing',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      applicationId: model.application_id,
      applyEndDate: model.apply_end_date,
      user: model.user,
    };
    done(null, data);
  },
};
