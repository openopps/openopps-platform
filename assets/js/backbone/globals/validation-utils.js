var $ = require('jquery');
var _ = require('underscore');

global.validatePassword = function (username, password) {
  var rules = {
    username: false,
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false,
  };
  var _username = username.toLowerCase().trim();
  var _password = password.toLowerCase().trim();
  // check username is not the same as the password, in any case
  if (_username != _password && _username.split('@',1)[0] != _password) {
    rules['username'] = true;
  }
  // length > 8 characters
  if (password && password.length >= 8) {
    rules['length'] = true;
  }
  // Uppercase, Lowercase, and Numbers
  for (var i = 0; i < password.length; i++) {
    var test = password.charAt(i);
    // from http://stackoverflow.com/questions/3816905/checking-if-a-string-starts-with-a-lowercase-letter
    if (test === test.toLowerCase() && test !== test.toUpperCase()) {
      // lowercase found
      rules['lower'] = true;
    }
    else if (test === test.toUpperCase() && test !== test.toLowerCase()) {
      rules['upper'] = true;
    }
    // from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
    else if (!isNaN(parseFloat(test)) && isFinite(test)) {
      rules['number'] = true;
    }
  }
  // check for symbols
  if (/.*[^\w\s].*/.test(password)) {
    rules['symbol'] = true;
  }
  return rules;
};

/**
 * Validate an input field.  Assumes that there is a data
 * variable in the HTML tag called `data-validate` with the
 * validation options that you want to enforce.
 *
 * email is only meant to allow the value is generally email shaped
 *    it is not bullet proof
 *
 * emaildomain requires a data-emaildomain variable in the HTML tag
 *    it will validate against the value there
 *
 * The input should be in a `required-input` component,
 * and the component should have a .help-text element
 * with a class `.error-[code]` where [code] is the
 * validation rule (eg, `empty`);
 *
 * Expects an object with currentTarget, eg { currentTarget: '#foo' }
 */
global.validate = function (e) {
  var target = (e.currentTarget.classList && e.currentTarget.classList.contains('select2-container')) ? e.currentTarget.nextSibling : e.currentTarget;
  var opts = String($(target).data('validate')).split(',');
  var val = ($(target).prop('tagName') == 'DIV' ? $(target).text().trim() : $(target).val().trim());
  var parent = $(target).parents('.required-input, .checkbox')[0];
  var result = false;
  _.each(opts, function (o) {
    if (o == 'empty') {
      if (!val) {
        $(parent).find('.error-empty').show();
        result = true;
      } else {
        $(parent).find('.error-empty').hide();
      }
      return;
    }
    if (o == 'radio') {
      if ($(target).prop('checked').length <= 0) {
        $(parent).find('.error-radio').show();
        result = true;
      } else {
        $(parent).find('.error-radio').hide();
      }
      return;
    }
    if (o == 'checked') {
      if ($(target).prop('checked') !== true) {
        $(parent).find('.error-checked').show();
        result = true;
      } else {
        $(parent).find('.error-checked').hide();
      }
      return;
    }
    if(o == 'html') {
      if(/[<>]/.test(val)) {
        $(parent).find('.error-html').show();
        result = true;
      } else {
        $(parent).find('.error-html').hide();
      }
      return;
    }
    if (o.substring(0,5) == 'count') {
      var len = parseInt(o.substring(5));
      if (val.length > len) {
        $(parent).find('.error-' + o).show();
        result = true;
      } else {
        $(parent).find('.error-' + o).hide();
      }
      return;
    }
    if (o == 'confirm') {
      var id = $(target).attr('id');
      var newVal = $('#' + id + '-confirm').val();
      if (val != newVal) {
        $(parent).find('.error-' + o).show();
        result = true;
      } else {
        $(parent).find('.error-' + o).hide();
      }
      return;
    }
    if (o == 'button') {
      if (!($($(parent).find('#' + $(target).attr('id') + '-button')[0]).hasClass('btn-success'))) {
        $(parent).find('.error-' + o).show();
        result = true;
      } else {
        $(parent).find('.error-' + o).hide();
      }
    }
    var bits;
    if (o == 'email'){
      var correctLength = false;
      if ( val !== '' && val.indexOf('@') >= 2 ){
        bits = val.split('@');
        var addrBits = bits[1].split('.');
        if ( addrBits.length >=2 ) {
          for (i=0; i<addrBits.length; i++ ){
            if ( addrBits[i].length < 2 ){
              correctLength = false;
              break;
            } else {
              correctLength = true;
            }
          }
        }
      }
      if (val !== '' && (!correctLength || bits[0].length < 2)) {
        $(parent).find('.error-email').show();
        result = true;
      } else {
        $(parent).find('.error-email').hide();
      }
      return;
    }
    if ( o== 'emaildomain'){
      var domain = $(target).data('emaildomain');
      if ( val !== '' && val.indexOf('@') >= 2 ){
        bits = val.split('@');
        if ( bits[1] != domain ){
          $(parent).find('.error-emaildomain').show();
          result = true;
        } else {
          $(parent).find('.error-emaildomain').hide();
        }
      }
      return;
    }
  });
  if (result === true) {
    $(parent).addClass('usa-input-error');
    $(':button.disable').attr('disabled', 'disabled');
    $(':submit.disable').attr('disabled', 'disabled');
    
  } else {
    $(parent).removeClass('usa-input-error');
    if ($('form').find('*').hasClass('usa-input-error')) {
      $(':button.disable').attr('disabled', 'disabled');
      $(':submit.disable').attr('disabled', 'disabled');
    } else {
      $(':button.disable').removeAttr('disabled');
      $(':submit.disable').removeAttr('disabled');
    }
  }
  return result;
};