var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

/**
 *
 * Home page tests
 *
 */

casper.options.waitTimeout = 1000 * 15;
casper.options.viewportSize = {width: 1000, height:1000};
casper.userAgent('Mozilla/5.0');
casper.on('remote.message', function(message) {
  console.log('browser console.log ==> ', message);
});
casper.on('page.error', function(msg, trace) {
  console.log('!!! page.error !!!')
  console.log("Error:    " + msg, "ERROR");
  console.log("trace:     ", trace);
  // console.log("file:     " + trace[0].file, "WARNING");
  // console.log("line:     " + trace[0].line, "WARNING");
  // console.log("function: " + trace[0]["function"], "WARNING");
});
casper.on('resource.error', function(message) {
  console.log('resource.error ==> ', message);
});

before(function() {
  console.log('before', process.env.TEST_ROOT);
  casper.start(process.env.TEST_ROOT);
});

describe('Home page', function() {

  it('should have success status', function() {
    console.log('should have success status');

    casper.then(function() {
      assert.equal(this.status().currentHTTPStatus , 200);
    });
  });

  it('should have correct title', function() {
    casper.then(function() {
      assert.equal(casper.getTitle(), "Open Opportunities");
    });
  });

  it('should link to /tasks', function() {
    casper.then(function() {
      casper.waitForText('Browse opportunities', function afterPageText() {
        casper.click('a.nav-link');
        assert.equal(casper.getCurrentUrl(), process.env.TEST_ROOT + '/tasks');
      });
    });
  });

});
