module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) – The primary phase has started',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      user: model.user,
      alternatephaselink: model.alternatephaselink,
      agencyportallink: model.agencyportallink,
      boardspopulated: model.boardspopulated,
      emailsqueued: model.emailsqueued,
    };
    done(null, data);
  },
};
