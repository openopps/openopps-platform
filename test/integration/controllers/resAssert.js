//
// helpers for evaluating common response object values
//
var assert = require('chai').assert;

module.exports = {
  isTrue: function(res) {
    assert.equal(res.body, true);
  },
  isFalse: function(res) {
    assert.equal(res.body, false);
  },
  isEmptyObject: function(res) {
    assert.deepEqual(res.body, {});
  }

}
