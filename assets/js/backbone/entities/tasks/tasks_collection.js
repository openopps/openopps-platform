'use strict';
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var TaskModel = require('./task_model');

var TasksCollection = Backbone.Collection.extend({

  model: TaskModel,

  parse: function (response) {
    if (response) {
      if (response.tasks) {
        return response.tasks;
      }
      return response;
    }
    return [];
  },

  url: '/api/task',

  initialize: function () {

    var collection = this;

    this.listenTo( this, 'task:save', function ( data ) {
      collection.addAndSave( data );
    });

    this.listenTo( this, 'task:draft', function ( data ) {
      collection.addAndSave( data );
    });

  },

  /*
   * Add data to the collection
   */
  addAndSave: function ( data ) {

    var collection = this;

    this.add( data )
      .save( null, {

        success: function ( model ) {

          if ( 'draft' !== model.attributes.state ) {

            collection.trigger( 'task:save:success', model.attributes.id );

          } else {

            collection.trigger( 'task:draft:success', model );

          }

        },

        error: function ( model, response, options ) {

          collection.trigger( 'task:save:error', model, response, options );

        },

      } );

  },

});

module.exports = TasksCollection;
