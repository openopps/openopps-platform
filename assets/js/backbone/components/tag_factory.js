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

    addTagEntities: function (tag,done) {
    	//assumes
    	//  tag -- array of tag objects to add
    	//  tagType -- string specifying type for tagEntity table

        
    	//this is current solution to mark a tag object as on the fly added
        if ( typeof tag.unmatched == 'undefined' || !tag.unmatched ){
          return done();
        }

        $.ajax({
          url: '/api/tagEntity',
          type: 'POST',
          data: {
            type: tag.tagType,
            name: tag.id
          },
          success: function (data){
            //is this required? let's test at some point
            console.log("data dump", data);
            //tag.id = data.id;
            tag = data;
            done();
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

    addTag: function (contextObj,tag, done) {
    	//assumes
    	//  tag -- array of tag objects to add
    	//  --- NYI ---
    	//  projet or task id - string


    	 //if (!tag || !tag.id) return done();
       // if (tag.tagId) return done();

          if ( _.isObject(tag) ) {
             var tagMap = {
              // --- NYI ---
              // or proecjt id
              taskId: contextObj.tempTaskId,
              tagId: tag.id
            }
              
          } else {
            console.log("tag ", tag);
            var tagMap = {
              taskId: contextObj.model.id,
              tagId: tag
            }
          }

          $.ajax({
            url: '/api/tag',
            type: 'POST',
            data: tagMap,
            success: function (data) {
              done();
            },
            error: function (err) {
              done(err);
            }
          });

    },

    createTagDropDown: function(options) {
        self.$(options.selector).select2({
          placeholder: "Start typing to select a "+options.type,
          minimumInputLength: 2,
          multiple: true,
          // this width setting is a hack to prevent placeholder from getting cut off
          width: "556px",
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

      createDiff: function (oldTags, newTags, types) {
        var out = {
          remove: [],
          add: [],
          none: []
        };

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

        for (var t in types) {
          // check if

          _.each(newTags[types[t]], function (newTag) {
            findTag(newTag, oldTags);
          });
          
          // if there's any tags left in oldTags, they need to be deleted
          findDel(oldTags, types[t]);
        }
        return out;
      },

      saveNewTags: function (topics,skills,locations) {
        var self = this;

        var tags = [];
        tags.push.apply(tags, topics);
        tags.push.apply(tags, skills);
        tags.push.apply(tags, locations);

        async.eachSeries(tags, this.addTagEntities, function (err){

        });

        return tags;
      }

  });

return Application.Component.TagFactory;
});



