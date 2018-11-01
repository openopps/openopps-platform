'use strict';
var _ = require('underscore');

// Wrapper for server User class
var _createClass = function () { function defineProperties (target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var User = function () {
  function User (data) {
    _classCallCheck(this, User);

    // initialize with data that comes from server, backendUser or /user/:id
    // to be compatible with prior usage of raw object
    for (var i in data) {
      this[i] = data[i];
    }
    if (this.name) {
      var name = this.name;
      var nameSplit = name.split(' ');
      this.initials = nameSplit[0].charAt(0).toUpperCase();
      if(nameSplit[1]) {
        this.initials += nameSplit[1].charAt(0).toUpperCase();
      }
    }
  }

  return User;
}();

module.exports = User;
