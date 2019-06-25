
var $ = require('jquery');
var _ = require('underscore');

const whoopsPage = require('../apps/error/templates/whoops.html');

// import URLSearchParams polyfill
require('url-search-params-polyfill');

global.showWhoopsPage = function () {
  $('#container').html(_.template(whoopsPage));
  $('#search-results-loading').hide();
  window.scrollTo(0, 0);
};

global.detectBrowser = function () {
  var ua = navigator.userAgent, tem;
  M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return 'IE ' + (tem[1] || '');
  }
  if(M[1] === 'Chrome'){
    tem= ua.match(/\bOPR\/(\d+)/);
    if (tem != null) return 'Opera ' + tem[1];
  }
  M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  return M;        
};

global.setSelectHeight = function (ele) {
  var newHeight = $(ele).next('div').outerHeight() - 20;
  $(ele).height(newHeight);
};

/**
 * Takes a select element and wraps the text
 * 
 * @param {HTMLElement} ele the select element
 */
global.initializeSelectWrapping = function (ele) {
  var myBrowser = detectBrowser();
  var renderWidth = $(ele).outerWidth();
  var renderWidthFixed = renderWidth;
  var borderwidth = $(ele).css('border-bottom-width');
  var defaultValue = $(ele).find('option:selected').text().trim();
  if (borderwidth == '0px') { borderwidth = '1px'; /*FF*/ }
  $(ele).css({ cursor: 'pointer' });
    
  // set by browser (different buttons):
  var topParsed = Math.round(parseInt(borderwidth.replace(/[^0-9.]+/g,'')));
  switch(myBrowser[0]) {
    case 'MSIE': renderWidthFixed = renderWidth - 28; break;
    case 'I': renderWidthFixed = renderWidth - 28; break;                 
    case 'Chrome': renderWidthFixed = renderWidth - 30; break;
    case 'Firefox': renderWidthFixed = renderWidth - 27; break;
    case 'Safari': renderWidthFixed = renderWidth - 27; break;
  }
  //wrap + add a overlapping layer that will hide content and calculate the correct height:
  $(ele).wrap($('<div />').css({width:renderWidth, margin:0, padding:0, position:'relative'}));
  $(ele).after($('<div>' + defaultValue + '</div>')
    .css({
      minHeight: 45,
      padding: '1rem 0.7em',
      width: renderWidthFixed,
      backgroundColor: 'white',
      whiteSpace: 'pre-wrap',
      position: 'absolute',
      top: topParsed,
      cursor: 'default',
      left: borderwidth,
    })
  );
  //set select box new height:
  setSelectHeight(ele);
    
  //append change behavior:
  $(ele).change(function () {
    $(ele).next('div').text($(ele).find('option:selected').text().trim());
    setSelectHeight(ele);
  });
};

/**
 * Takes a name and pulls the first letter of first name
 * and first letter of last name if it exist. If name is 
 * an empty string it will return an empty string.
 * 
 * @param {string} name name to convert to initials [John J Smith]
 * @returns {string} first and last initial [JS]
 */
global.getInitials = function (name) {
  var initials = name.split(' ').map(function (part) { 
    return part.charAt(0).toUpperCase();
  });
  return initials.length > 2 ? _.first(initials) + _.last(initials) : initials.join('');
};

/**
 * Takes a user id and return an initials color class.
 * 
 * @param {number} id user id [42]
 * @returns {string} initials color class [initials-color-2]
 */
global.getInitialsColor = function (id) {
  return 'initials-color-' + ((id % 5) + 1);
};

/**
 * Helper function to get values from query string
 */
global.getUrlParameter = function (name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

/**
 * Organize the tags output into an associative array key'd by their type.
 * If the tag has more than one value for said key, make it an array otherwise
 * keep it as a top level object.
 * @param  {[array]} tags           [array of tags]
 * @return {[object]}               [bindingObject returned out]
 */
global.organizeTags = function (tags) {
  // put the tags into their types
  return _(tags).groupBy('type');
};