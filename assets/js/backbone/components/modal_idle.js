// Idle Modal component
// This component will notify the user of a pending session expiration.
// There are two JS timeouts. The first is when should we display the
//    modal to the user, and the second is how long after displaying
//    the modal do we force a logout.
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseComponent = require('../base/base_component');
var ModalIdleTemplate = require('./modal_idle_template.html');

var ModalIdle = BaseComponent.extend({
  events: {
    'click .idle-reset'  : 'resetTimeout',
    'click .idle-logout' : 'logout',
  },

  initialize: function (options) {
    var self = this;
    this.options = options;
    this.keyPressCount = 0;
    this.timeSinceLastKeyPress = 0;
    this.data = {
      id: 'modal-idle',
      modalTitle: 'Your Session is About to Expire!',
    };
    this.initializeListeners();
  },

  initializeListeners: function () {
    var self = this;
    this.listenTo(window.cache.userEvents, 'idle:reset', function () {
      self.resetTimeout();
    });
    document.onkeyup   = self.keyPressCheck.bind(this);
    document.onkeydown = self.keyPressCheck.bind(this);
  },

  render: function () {
    var compiledTemplate = _.template(ModalIdleTemplate)(this.data);
    this.$el.html(compiledTemplate);
    return this;
  },

  cleanup: function () {
    removeView(this);
  },

  keyPressCheck: function () {
    var d = new Date();
    var now = d.getTime();
    if (this.keyPressCount >= 30 || (now - this.timeSinceLastKeyPress) > 60 * 1000) {
      this.resetTimeout();
      this.keyPressCount = 0;
    } else {
      this.keyPressCount++;
    }
    this.timeSinceLastKeyPress = now;
  },

  resetTimeout: function () {
    $.getJSON('/csrfToken', function (t) {
      $('meta[name="csrf-token"]').attr('content', t._csrf);
      if(this.timeoutID) clearTimeout(this.timeoutID);
      if(this.warningID) clearTimeout(this.warningID);
      this.timeoutID = setTimeout(function () {
        this.warningID = setTimeout(function () {
          this.logout();
        }.bind(this), 3 * 60 * 1000); // Logout after 3 minutes
        $('#' + this.data.id).modal('show');
      }.bind(this), 27 * 60 * 1000); // 27 minutes then show 3 minute warning
      $('#' + this.data.id).modal('hide');
    }.bind(this));
  },

  logout: function () {
    $('#' + this.data.id).modal('hide');
    setTimeout(function () {
      window.cache.userEvents.trigger('user:request:logout');
    }, 500);
  },
});

module.exports = ModalIdle;
