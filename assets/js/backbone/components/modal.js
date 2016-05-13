/**
 * The Modal component needs to be set to the el: of the parent view
 * you are trying to init it within, then you will be appending the modal-template to that
 * view (this).  Then the form view has an el of $(".modal-body") so that the form will render
 * within that body area.
 * Then all you have to do is set the ID of the modal to the ID of the link you are trying
 * to trigger from as per bootstrap BP.
 */

var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseComponent = require('../base/base_component');

var ModalTemplate = fs.readFileSync(
  __dirname + '/modal_template.html'
).toString();


var Modal = BaseComponent.extend({
  events: {
    "click .link-backbone": "link"
  },

  initialize: function(options) {
    this.options = options;
  },

  render: function() {
    var data = {
      id: this.options.id,
      modalTitle: this.options.modalTitle,
      disableClose: this.options.disableClose
    };

    var compiledTemplate = _.template(ModalTemplate)(data);
    this.$el.append(compiledTemplate);

    return this;
  },

  link: function(e) {
    if (e.preventDefault) e.preventDefault();
    // hide the modal, wait for it to close, then navigate
    $('#' + this.options.id).bind('hidden.bs.modal', function() {
      linkBackbone(e);
    }).modal('hide');
  },

  cleanup: function() {
    removeView(this);
  }
});


module.exports = Modal;
