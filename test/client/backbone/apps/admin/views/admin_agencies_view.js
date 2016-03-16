var assert = require('chai').assert;
var sinon = require('sinon');
var AdminAgenciesView = require('../../../../../../assets/js/backbone/apps/admin/views/admin_agencies_view.js');
var Backbone = require('backbone');
var jquery = require('jquery');
// Expose jQuery to views, which currently assume it exists on global window object
window.$ = jquery;

describe('AdminAgenciesView', function () {
  beforeEach(function () {
    window.cache = {
      currentUser: {
        tags: [
          { type: 'agency', id: 1 },
        ],
      },
    };
  });

  it('should initialize user\'s agency', function () {
    var view = new AdminAgenciesView();
    assert.equal(view.data.agency.id, 1, 'agency id');
  });

  describe('render', function () {
    beforeEach(function () {
      sinon.stub($, 'ajax');
      sinon.stub(Backbone.history, 'navigate');
    });

    afterEach(function () {
      $.ajax.restore();
      Backbone.history.navigate.restore();
    });

    it('should fetch user\'s agency', function () {
      var view = new AdminAgenciesView();
      view.render();
      assert($.ajax.called, 'XHR requested');
      assert($.ajax.firstCall.args[0].url, '/api/admin/agency/1', 'user\'s agency request');
    });

    it('should update the URL', function () {
      var view = new AdminAgenciesView();
      view.render();
      assert(Backbone.history.navigate.calledWith('/admin/agencies/1'), 'updated URL');
    });
  });
});
