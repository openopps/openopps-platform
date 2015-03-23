var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var casper_chai = require('casper-chai');
chai.use(casper_chai);

// access environment vars
var system = require('system');

/**
 *
 * Home page tests
 *
 */

 before(function() {
   casper.start(system.env.TEST_ROOT, function afterStart() {
     this.options = {
       waitTimeout: 1000 * 15
     }
     this.on('remote.message', function(message) {
       this.log('browser console.log ==> ' + message);
     });
   }).viewport(1000,1000).userAgent('Mozilla/5.0');
 })


describe('Home page', function() {

  it('should have success status', function() {
    casper.then(function() {
      assert.equal(casper.currentHTTPStatus,200);
    })
  })

  it('should have correct title', function() {
    casper.then(function() {
      assert.equal(casper.getTitle(), "midas");
    })
  })

  it('should link to /tasks', function() {
    casper.then(function() {
      casper.waitForText('Opportunities', function waitForTextOpportunities() {
        casper.click('.tasks .nav-link[href]')
        assert.equal(casper.getCurrentUrl(), system.env.TEST_ROOT + '/tasks');
      })
    });
  });

});

/**
 *
 * Task page tests
 *
 */
describe('Task page', function() {

  it('should have success status', function() {
    casper.then(function() {
      assert.equal(casper.currentHTTPStatus,200);
    })
  })

  it('should have task listing page', function() {
    casper.then(function() {
      casper.waitForSelector('#browse-list', loaded, failed, 1000 * 15);
      function loaded() {
        assert.ok(true);
      }
      function failed() {
        assert.ok(false);
      }
    });
  });

  it('should have task list with tasks', function() {
    casper.then(function() {
      assert.equal(1, casper.getElementsInfo('.task-box').length);
    });
  });

  it('should have task page with matching content', function() {
    var sel = '.task-box .task-list-title a',
        linkTitle = casper.fetchText(sel).trim();
    casper.click(sel);
    casper.then(function() {
      var sel = '.main-section h1';
      casper.waitForSelector(sel, loaded, failed, 1000 * 15);
      function loaded() {
        assert.equal(linkTitle, casper.fetchText(sel).trim());
      }
      function failed() {
        assert.ok(false);
      }
    });
  });

});
