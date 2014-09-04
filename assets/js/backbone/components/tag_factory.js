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
    	//  projet or task id - string

      var tagMap = {};
      tagMap[modelType] = modelId;

      if ( _.isFinite(tag) ){  
          // --- NYI ---
          // or proecjt id
        
          tagMap.tagId = tag;
      } else {
          // --- NYI ---
          // or proecjt id

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
          // this width setting is a hack to prevent placeholder from getting cut off
          //width: "556px",
          width: "500px",
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

      createDiff_new: function ( oldTags, currentTags){

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
      },

      createDiff: function (oldTags, newTags, types, context) {

        var out = {
          remove: [],
          add: [],
          none: []
        };
        return out;        
        // find if a new tag selected already exists
        // if it does, remove it from the array
        // if it doesn't, add to the new list

        var findTag = function (tag, oldTags) {
          
          if(!tag) return;

          var none = null;
          for (var j in oldTags) {
            // if the tag is in both lists, do nothing
            if (oldTags[j].tagId == parseInt(tag.id)) {
              
              out.none.push(oldTags.id);
              none = j;
              break;
            }
          }

          // if in both lists, splice out of the old list
          if (none) {
            oldTags.splice(none, 1);
          } else {
            // the new tag was not found, so we have to add it
            out.add.push(parseInt(tag.id));
          }
        };

        var findDel = function (oldTags, type) {
          for (var j in oldTags) {
            // anything left of this type should be deleted
            if (oldTags[j].type == type) {
              out.remove.push(oldTags[j].id);
            }
          }
        };



      _.each(newTags, function (newTag) {
        
        _.each(newTag, function ( nTag ) {
          
          if ( nTag.id != nTag.name )  {
            findTag(nTag, oldTags);
          }

        });
        
      });
          
          // if there's any tags left in oldTags, they need to be deleted
      findDel(oldTags, types[t]);
        
        return out;
      }

  });

return Application.Component.TagFactory;
});



