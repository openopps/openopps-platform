module.exports = {

  subject: '"<%- model.title %>" has a new comment on <%= globals.systemName %>',

  to: '<%- owner.username %>',

  /*
  * Prepares the data object to render templates
  * @param {Notification} notification model
  * @param {function} callback called with err, data
  * data.globals defaults to sails.config
  */
  data: function( model, done ) {

    var data = {
      comment: model,
      commenter: {},
      model: {},
      owner: {},
    };
    User.findOne( { id: model.userId } ).exec( function ( err, commenter ) {
      if ( err ) { return done( err ); }

      var Model = ( model.projectId ) ? Project : Task;
      var modelId = model.projectId || model.taskId;

      // TODO: Does this need two references to the `commenter` object?
      // Explore how `data` is being used within the Notification template and refactor, maybe.
      data.owner = data.commenter = commenter;

      Model.findOne( { id: modelId } ).exec( function( err, model ) {

        if ( err ) { return done( err ); }

        data.model = model;

        done( null, data );

      } );

    } );

  },
};
