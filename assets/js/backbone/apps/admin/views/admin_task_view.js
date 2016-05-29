// vendor
var _ = require('underscore');
var Backbone = require('backbone');

var TaskModel = require( '../../../entities/tasks/task_model' );

// templates
var fs = require('fs');
var AdminTaskTemplate = fs.readFileSync(`${__dirname}/../templates/admin_task_template.html`).toString();

var AdminTaskView = Backbone.View.extend({

  events: {

    'click .delete-task'  : 'deleteTask',
    'click .js-task-open' : 'openTask',

  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1,
    };
  },

  render: function () {
    var view = this;
    var url = '/admin/tasks';
    if (this.options.agencyId) url = url + '/' + this.options.agencyId;
    Backbone.history.navigate(url);

    $.ajax({
      url: '/api' + url,
      data: this.data,
      dataType: 'json',
      success: function ( data ) {
        var template = _.template( AdminTaskTemplate )( data );
        view.$el.html( template );
        view.$el.show();
        $( '.tip' ).tooltip();
        $( '.js-tip' ).tooltip();
      },
    });

    return this;

  },


  /*
   * Open a "submitted" task from the admin task view.
   * @param { jQuery Event } event
   */
  openTask: function ( event ) {

    event.preventDefault();

    var view = this;
    var id = $( event.currentTarget ).data( 'task-id' );
    var title = $( event.currentTarget ).data( 'task-title' );

    var task = new TaskModel( { id: id } );

    task.fetch( {

      success: function ( model, response, options ) {

        var userConfirmed = window.confirm( 'Are you sure you want to publish "' + model.attributes.title + '"?' );

        if ( userConfirmed ) {

          model.save( {

            state: 'open',

          }, {

            success: function ( model, response, options ) {

              view.render();

            },

          } );

        }

      },

      error: function ( model, response, options ) {},

    } );

  },

  deleteTask: function(e) {
    var view = this,
        id = $(e.currentTarget).data('task-id'),
        title = $(e.currentTarget).data('task-title');
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete "' + title + '"?')) {
      $.ajax({
        url: '/api/task/' + id,
        type: 'DELETE'
      }).done(function() {
        view.render();
      });
    }
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = AdminTaskView;
