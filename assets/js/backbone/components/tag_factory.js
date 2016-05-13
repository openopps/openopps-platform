/**
 * This component implements a tag widget, allowing creation lookup and deletion of tags from a common ui element
 *
 * Options:
 *
 */

var $ = require('jquery');
window.jQuery = $;    // TODO: this is weird, but select2 wants it

var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var i18n = require('i18next');
var marked = require('marked');
var select2 = require('select2');

var BaseComponent = require('../base/base_component');


var TagFactory = BaseComponent.extend({
  initialize: function(options) {
    this.options = options;

    return this;
  },

  addTagEntities: function(tag, context, done) {
    //assumes
    //  tag -- array of tag objects to add
    //  tagType -- string specifying type for tagEntity table
    var self = this;

    //this is current solution to mark a tag object as on the fly added
    if (!tag || typeof tag.unmatched == 'undefined' || !tag.unmatched) {
      return done();
    }
    //remove the flag that marks them as new
    delete tag.unmatched;

    $.ajax({
      url: '/api/tagEntity',
      type: 'POST',
      data: {
        type: tag.tagType,
        name: tag.id,
        data: tag.data
      },
      success: function(data) {
        if (context.data) {
          context.data.newTag = data;
          context.data.newItemTags.push(data);
        }
        return done(null, data);
      }
    });
  },

  /*
    required:
    @param {Object}   options
    @param {String}   options.type               - The tag type this dropdown will operate with
    @param {String}   options.selector           - CSS selector of the new dropdown, element should be preexisting

    optional:
    @param {String}   options.width='500px'      - CSS width attribute for the dropdown
    @param {String}   options.placeholder='Yo'   - Text that is initially displayed as a placeholder in field
    @param {Boolean}  options.multiple=true      - Whether to allow multiple tags to be selected
    @param {Boolean}  options.allowCreate=true   - Whether a `createSearchChoice` option will be given
    @param {String[]} options.tokenSeparators=[] - Array of valid tag delimeters
    @param {*}        options.data=undefined     - The initial data loaded into the select2 element

    @returns {jQuery element}                    - The initialized jQuery element selected by options.selector
  */
  createTagDropDown: function(options) {

    //location tags get special treatment
    var isLocation = (options.type === 'location');

    //have to check these beforehand to allow False values to override the default True
    options.multiple = (options.multiple !== undefined ? options.multiple : true);
    options.allowCreate = (options.allowCreate !== undefined ? options.allowCreate : true);

    var tagLabel = i18n.t("tag." + options.type);

    //construct the settings for this tag type
    var settings = {

      placeholder: options.placeholder || "Start typing to select a " + tagLabel,
      minimumInputLength: (isLocation ? 1 : 2),
      selectOnBlur: !isLocation,
      width: options.width || "500px",
      tokenSeparators: options.tokenSeparators || [],
      multiple: options.multiple,

      formatResult: function(obj, container, query) {
        //allow the createSearchChoice to contain HTML
        return (obj.unmatched ? obj.name : _.escape(obj.name));
      },

      formatSelection: function(obj, container, query) {
        return (obj.unmatched ? obj.name : _.escape(obj.name));
      },

      ajax: {
        url: '/api/ac/tag',
        dataType: 'json',
        data: function(term) {
          return {
            type: options.type,
            q: term
          };
        },
        results: function(data) {
          return { results: data };
        }
      }
    };

    //if requested, give users the option to create new
    if (options.allowCreate) {
      settings.createSearchChoice = function(term, values) {
        values = values.map(function(v) {
          return (v.value || '').toLowerCase();
        });

        if (values.indexOf(term.toLowerCase()) >= 0)
          return false; //don't prompt to "add new" if it already exists

        //unmatched = true is the flag for saving these "new" tags to tagEntity when the opp is saved
        return {
          unmatched: true,
          tagType: options.type,
          id: term,
          value: term,
          temp: true,
          name: "<b>" + _.escape(term) + "</b> <i>" + (isLocation ?
            "search for this location" :
            "click to create a new tag with this value") + "</i>"
        };
      };
    }

    //init Select2
    var $sel = $(options.selector).select2(settings);

    //event handlers
    $sel.on("select2-selecting", function(e) {
      if (e.choice.tagType === 'location') {
        if (e.choice.temp) {
          this.temp = true;
          e.choice.name = '<em>Searching for <strong>' + e.choice.value + '</strong></em>';

          //lookup the new location
          $.get('/api/location/suggest?q=' + e.choice.value, function(d) {
            d = _(d).map(function(item) {
              return {
                id: item.name,
                name: item.name,
                unmatched: true,
                tagType: 'location',
                data: _(item).omit('name')
              };
            });
            this.cache = $sel.select2('data');
            if (settings.multiple) {
              //remove the "Searching for..." text from multi-select boxes
              this.cache = _.reject(this.cache, function(item) {
                return (item.name.indexOf('Searching') >= 0);
              });
            }
            $sel.select2({
              data: { results: d, text: 'name' },
              width: settings.width,
              multiple: settings.multiple,
              formatResult: settings.formatResult,
              formatSelection: settings.formatSelection,
              createSearchChoice: settings.createSearchChoice,
            }).select2('data', this.cache).select2('open');
            $sel.remote = false;
          });
        } else {
          this.reload = true;
          delete this.temp;
        }
      } else { //if this is NOT a location tag
        if (e.choice.hasOwnProperty("unmatched") && e.choice.unmatched) {
          //remove the hint before adding it to the list
          e.choice.name = e.val;
        }
      }
    });

    $sel.on('select2-blur', function(e) {
      if (!this.reload && this.temp) {
        this.reload = true;
        delete this.temp;
      }
    });

    $sel.on('select2-open', function(e) {
      if (!this.reload && this.open) {
        delete this.open;
        delete this.temp;
        var cache = $("#location").select2('data');
        setTimeout(function() {
          $("#location").select2(settings)
            .select2('data', cache)
            .select2('open');
        }, 0);
      } else if (this.reload && this.open) {
        delete this.reload;
      }
    });

    //load initial data, if provided
    if (options.data) {
      $sel.select2('data', options.data);
    }

    return $sel;
  },

});

module.exports = TagFactory;
