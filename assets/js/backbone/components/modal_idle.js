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
    'click #idle-reset-button'  : 'resetTimeout',
    'click #idle-logout-button' : 'logout',
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

    $('body').append('<div class="usajobs-modal__canvas-blackout" tabindex="-1" aria-hidden="true"></div>');

    return this;
  },

  cleanup: function () {
    $('.usajobs-modal__canvas-blackout').remove();
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
        this.toggleModal(true);
      }.bind(this), 12 * 60 * 1000); // 12 minutes then show 3 minute warning
      this.toggleModal(false);
    }.bind(this));
  },

  toggleModal: function (show) {
    if(show) {
      $('#' + this.data.id).attr('data-state', 'is-open');
      $('body').append('<div class="usajobs-modal__canvas-blackout" tabindex="-1" aria-hidden="true"></div>');
    } else {
      $('#' + this.data.id).attr('data-state', 'is-closed');
      if(_.isEmpty($('#site-modal').html())) { // only remove if their is not another modal
        $('.usajobs-modal__canvas-blackout').remove();
      }
    }
    $('#' + this.data.id).attr('aria-hidden', !show);
  },

  logout: function () {
    this.toggleModal(false);
    setTimeout(function () {
      Backbone.history.navigate('/logout', { trigger: true });
    }, 500);
  },
});

module.exports = ModalIdle;
