var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var TagFactory = require('../../../components/tag_factory');
var User = require('../../../../utils/user');

var LoginCreateTemplate = require('../templates/login_create_template.html');

var LoginCreateView = Backbone.View.extend({
  el: '#container',

  events: {
    'click .oauth-link' : 'link',
    'blur .validate'    : 'validateField',
    'blur #rusername'  : 'checkUsername',
    'click #rusername-button'     : 'clickUsername',
    'blur .select2-container'     : 'checkSelect2',
    'blur #ragency'             : 'checkSelect2',
    'blur #rlocation'           : 'checkSelect2',
    'submit #registration-form'   : 'submitRegister',
  },

  initialize: function (options) {
    this.options = options;
    this.tagFactory = new TagFactory();
  },

  render: function () {
    var self = this;
    var data = {
      login: this.options.login,
      message: this.options.message,
    };
    var template = _.template(LoginCreateTemplate)(data);
    this.$el.html(template);
    this.$el.localize();
    
    var agencyTags = this.tagFactory.createTagDropDown({
      type: 'agency',
      selector: '#ragency',
      width: '100%',
      multiple: false,
      allowCreate: false,
      blurOnChange: true,
    });

    var locationTags = this.tagFactory.createTagDropDown({
      type: 'location',
      selector: '#rlocation',
      width: '100%',
      multiple: false,
      blurOnChange: true,
    });

    setTimeout(function () {
      self.$('#rname').focus();
    }, 500);
    return this;
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var link = $(e.currentTarget).attr('href');
    window.location.href = link;
  },

  validateField: function (e) {
    if(e.keyCode != 9) { // ignore tab key
      return validate(e);
    }
  },

  checkSelect2: function (e) {
    var id = e.currentTarget.id.replace('s2id_', '');
    if(_.isEmpty($('#' + id).val())) {
      $('#' + id).closest('.required-input').addClass('usa-input-error');
      $('#' + id).closest('.required-input').find('.field-validation-error.error-empty').show();
    } else {
      $('#' + id).closest('.required-input').removeClass('usa-input-error');
      $('#' + id).closest('.required-input').find('.field-validation-error.error-empty').hide();
    }
  },

  submitRegister: function (e) {
    var self = this,
        $submitButton = self.$('#registration-form [type="submit"]');
    if (e.preventDefault) e.preventDefault();

    // validate input fields
    var validateIds = ['#rname', '#rusername', '#rterms', '#ragency', '#rlocation'];

    var abort = false;
    for (var i in validateIds) {
      var iAbort = validate({ currentTarget: validateIds[i] });
      abort = abort || iAbort;
    }

    // if error, show them and return without submitting data
    if (abort) {
      $('.usa-input-error').get(0).scrollIntoView();
      return;
    }

    // Create a data object with the required fields
    var data = {
      name: this.$('#rname').val(),
      username: this.$('#rusername').val(),
      terms: (this.$('#rterms').val() === 'on'),
      tags: [
        this.$('#ragency').select2('data'),
        this.$('#rlocation').select2('data')
      ],
      json: true,
    };

    // Process tags
    data.tags = _(data.tags).chain()
      .filter(function (tag) {
        return _(tag).isObject() && !tag.context;
      })
      .map(function (tag) {
        return (tag.id && tag.id !== tag.name) ? +tag.id : {
          name: tag.name,
          type: tag.tagType,
          data: tag.data,
        };
      }).unique().value();

    // Post the registration request to the server
    $.ajax({
      url: '/api/auth/local/register',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
    }).done(function (success) {
      $.ajax({
        url: '/api/user',
        dataType: 'json',
      }).done(function (data) {
        $('#registration-error').hide();
        self.$('#main-content').hide();
        self.$('#registration-complete').show();
      });
    }).fail(function (error) {
      var d = JSON.parse(error.responseText);
      $('#registration-error-text').html(d.message);
      $('#registration-error').show();
      $('#registration-error')[0].scrollIntoView();
    });
  },

  checkUsername: function (e) {
    var username = $('#rusername').val();
    if(_.isEmpty(username)) {
      $('#rusername').closest('.required-input').addClass('usa-input-error');
      $('#rusername').closest('.required-input').find('.field-validation-error.error-empty').show();
      $('#rusername').closest('.required-input').find('.field-validation-error.error-email').hide();
      return true;
    } else {
      $('#rusername').closest('.required-input').find('.field-validation-error.error-empty').hide();
      $.ajax({
        url: '/api/user/username/' + username,
      }).done(function (data) {
        if (data) {
          // username is taken
          $('#rusername').closest('.required-input').addClass('usa-input-error');
          $('#rusername').closest('.required-input').find('.field-validation-error.error-email').show();
          return true;
        } else {
          // username is available
          $('#rusername').closest('.required-input').removeClass('usa-input-error');
          $('#rusername').closest('.required-input').find('.field-validation-error.error-email').hide();
          return false;
        }
      });
    }
  },

  clickUsername: function (e) {
    e.preventDefault();
  },

  cleanup: function () {
    if (this.loginPasswordView) { this.loginPasswordView.cleanup(); }
    if (this.loginCreateView) { this.loginCreateView.cleanup(); }
    removeView(this);
  },
});

module.exports = LoginCreateView;
