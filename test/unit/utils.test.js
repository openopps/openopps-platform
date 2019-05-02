const assert = require('chai').assert;
const utils = require('../../utils');

describe('Testing utils.js', function () {
  describe('.validatePassword', function () {
    var tests = [
      {
        message: 'Validating a password that matches the uri should return false.',
        method: 'validatePassword',
        args: ['TestUser', 'testuser@example.com'],
        expected: false,
      },
      {
        message: 'Validating a password that does not have at least 1 number should return false.',
        method: 'validatePassword',
        args: ['@badPassword', 'testuser@example.com'],
        expected: false,
      },
      {
        message: 'Validating a password that does not have at least 1 symbol should return false.',
        method: 'validatePassword',
        args: ['BadPa55w0rd', 'testuser@example.com'],
        expected: false,
      },
      {
        message: 'Validating a password that does not have at least 1 uppercase letter should return false.',
        method: 'validatePassword',
        args: ['b@dpassw0rd', 'testuser@example.com'],
        expected: false,
      },
      {
        message: 'Validating a password that does not have at least 1 lowercase letter should return false.',
        method: 'validatePassword',
        args: ['B@DPASSW0RD', 'testuser@example.com'],
        expected: false,
      },
      {
        message: 'Validating a password that meets all requirements should return true.',
        method: 'validatePassword',
        args: ['123qwe!@#QWE', 'testuser@example.com'],
        expected: true,
      },
    ];

    tests.forEach(function (test) {
      it(test.message, function () {
        var res = utils[test.method].apply(null, test.args);
        assert.equal(res, test.expected);
      });
    });
  });

  describe('.trimProperties', () => {
    it('Passing a string with trailing spaces should get trimmed.', () => {
      var res = utils.trimProperties('string ');
      assert.equal(res, 'string');
    });
    it('Passing a string with leading spaces should get trimmed.', () => {
      var res = utils.trimProperties(' string');
      assert.equal(res, 'string');
    });
    it('Passing a string with leading and trailing spaces should get trimmed.', () => {
      var res = utils.trimProperties(' string ');
      assert.equal(res, 'string');
    });
    it('Passing an array of strings should return an array of trimmed strings.', () => {
      var res = utils.trimProperties(['string 1 ', ' string 2', ' string 3 ']);
      assert.deepEqual(res, ['string 1', 'string 2', 'string 3']);
    });
    it('Passing an object of strings should return an object of trimmed strings.', () => {
      var res = utils.trimProperties({
        string1: 'string 1 ',
        string2: ' string 2',
        string3: ' string 3 ',
      });
      assert.deepEqual(res, {
        string1: 'string 1',
        string2: 'string 2',
        string3: 'string 3',
      });
    });
    it('Passing a complex object should return an object of trimmed properties.', () => {
      var date = new Date();
      var res = utils.trimProperties({
        one: ' string 1 ',
        two: [' string 2', 'string 3 ', date],
        three: 3,
        four: { five: ' string 4 ', six: [ 'string 5 ', ' string 6' ] },
        seven: true,
        eight: date,
      });
      assert.deepEqual(res, {
        one: 'string 1',
        two: ['string 2', 'string 3', date],
        three: 3,
        four: { five: 'string 4', six: [ 'string 5', 'string 6' ] },
        seven: true,
        eight: date,
      });
    });
  });
});
