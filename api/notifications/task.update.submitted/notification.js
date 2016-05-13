module.exports = {

  subject: 'New Open Opportunity Draft Submitted',

  to: '<%= user.username %>',

  /*
  * Prepares the data object to render templates
  * @param {Notification} notification model
  * @param {function} callback called with err, data
  * data.globals defaults to sails.config
  */
  data: function ( model, done ) {
    var data = {
      task: model,
      user: {},
    };
    User.findOne( { id: model.owner } ).exec( function ( err, user ) {
      if ( err ) return done( err );
      data.user = user;
      done( null, data );
    } );

  },

};
