module.exports = {

  subject: 'Thanks for your interest in Open Opportunities',
  to: '<%- user.uri %>',
  data: function ( model, done ) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done( null, data );
  },
};
