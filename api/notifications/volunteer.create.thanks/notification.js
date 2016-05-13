module.exports = {

  subject: 'Thanks for your interest in <%= task.title %>',

  to: '<%- user.username %>',

  cc: '<%- owner.username %>',

  /*
  * Prepares the data object to render templates
  * @param {Notification} notification model
  * @param {function} callback called with err, data
  * data.globals defaults to sails.config
  */
  data: function ( model, done ) {
    var data = {
      task: {},
      owner: {},
      user: {},
    };

    User.findOne( { id: model.userId } ).exec( function ( err, user ) {

      if ( err ) { return done( err ); }

      data.user = user;

      Task.findOne( { id: model.task} ).exec( function ( err, task ) {

        if ( err ) { return done( err ); }

        data.task = task;

        User.findOne( { id: task.owner } ).exec( function ( err, owner ) {

          if ( err ) { return done( err ); }

          data.owner = owner;

          done( null, data );

        } );

      } );

    } );

  },

};
