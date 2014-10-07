/**
 * This component implements a tag widget, allowing creation lookup and deletion of tags from a common ui element
 *
 * Options:
 *
 */
define([
  'jquery',
  'underscore',
  'backbone',
  'async',
  'utilities',
  'marked',
  'base_component',
  'jquery.selection'
], function ($, _, Backbone, async, utils, marked, BaseComponent, jqSelection ) {

  Application.Component.TagFactory = BaseComponent.extend({

  	initialize: function (options) {
      this.options = options;

      return this;
    },

    addTagEntities: function (tag, context, done) {
    	//assumes
    	//  tag -- array of tag objects to add
    	//  tagType -- string specifying type for tagEntity table
      var self = this;

    	//this is current solution to mark a tag object as on the fly added
        if ( typeof tag.unmatched == 'undefined' || !tag.unmatched ){
          return done();
        }
      //remove the flag that marks them as new
      delete tag.unmatched;

      $.ajax({
        url: '/api/tagEntity',
        type: 'POST',
        data: {
          type: tag.tagType,
          name: tag.id
        },
        success: function (data){
          context.data.newTag     = data;
          context.data.newItemTags.push(data);
          return done();
        }
      });
    },

    removeTag: function (id, done) {
      $.ajax({
        url: '/api/tag/' + id,
        type: 'DELETE',
        success: function (data) {
          return done();
        }
      });
    },

    addTag: function (tag, modelId, modelType, done) {
    	//assumes
    	//  tag -- array of tag objects to add
    	//  --- NYI ---
    	//  project or task id - string
      // TODO: abstract the below if-else to a different function so this funciton just takes an array tag ids

      var tagMap = {};
      tagMap[modelType] = modelId;

      if ( _.isFinite(tag) ){
          // --- NYI ---
          // or project id

          tagMap.tagId = tag;
      } else {
          // --- NYI ---
          // or project id

          tagMap.tagId = tag.id;
      }

      $.ajax({
        url: '/api/tag',
        type: 'POST',
        data: tagMap,
        success: function (data) {
          return done();
        },
        error: function (err) {
          return done(err);
        }
      });

    },

    createTagDropDown: function(options) {

        self.$(options.selector).select2({
          placeholder: "Start typing to select a "+options.type,
          minimumInputLength: 2,
          multiple: true,
          tokenSeparators: [","],
          width: options.width || "500px",
          formatResult: function (obj, container, query) {
            return obj.name;
          },
          formatSelection: function (obj, container, query) {
            return obj.name;
          },
          createSearchChoice: function (term) {
            //unmatched = true is the flag for saving these "new" tags to tagEntity when the opp is saved
            return { unmatched: true,tagType: options.type,id: term, value: term, name: "<b>"+term+"</b> <i>click to create a new tag with this value</i>" };
          },
          ajax: {
            url: '/api/ac/tag',
            dataType: 'json',
            data: function (term) {
              return {
                type: options.type,
                q: term
              };
            },
            results: function (data) {
              return { results: data }
            }
          }
        }).on("select2-selecting", function (e){
          if ( e.choice.hasOwnProperty("unmatched") && e.choice.unmatched ){
            //remove the hint before adding it to the list
            e.choice.name = e.val;
          }
        });

      },

      createDiff: function ( oldTags, currentTags){
        //sort tags into their needed actions
        //

        var out = {
          remove: [],
          add: [],
          none: []
        };

        var none = null;

        _.each(oldTags, function (oTag,oi){

          none = null;

          _.each(currentTags, function (cTag, ci){
              if ( parseInt(cTag.id) == oTag.tagId ){
                currentTags.splice(ci,1);
                none = oi;
              }
            });

          if( _.isFinite(none) ){
            out.none.push(parseInt(oldTags[none].tagId));
          } else {
            out.remove.push(parseInt(oTag.id));
          }
        });

        out.add = currentTags;

        return out;
      }

  });

return Application.Component.TagFactory;
});



