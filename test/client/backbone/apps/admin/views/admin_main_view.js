var assert = require('chai').assert;
var sinon = require('sinon');
var AdminMainView = require('../../../../../../assets/js/backbone/apps/admin/views/admin_main_view.js');
var AdminAgenciesView = require('../../../../../../assets/js/backbone/apps/admin/views/admin_agencies_view.js');
var jquery = require('jquery');
// Expose jQuery to views, which currently assume it exists on global window object
window.$ = jquery;

describe('AdminMainView', function () {
  var adminMainView;
  beforeEach(function () {
    adminMainView = new AdminMainView();
    window.cache = {
      currentUser: {
        isAdmin: false,
        isAgencyAdmin: false,
      },
    };
  });

  describe('isAdmin', function () {
    it('should check currentUser', function () {
      assert(!adminMainView.isAdmin(), 'not an admin');
      window.cache.currentUser.isAdmin = true;
      assert(adminMainView.isAdmin(), 'user is an admin');
    });
  });

  describe('isAgencyAdmin', function () {
    it('should check currentUser', function () {
      var adminMainView = new AdminMainView();
      assert(!adminMainView.isAgencyAdmin(), 'not an agency admin');
      window.cache.currentUser.isAgencyAdmin = true;
      assert(adminMainView.isAgencyAdmin(), 'user is an agency admin');
    });
  });

  describe('routeTarget', function () {
    var adminAgenciesView;
    beforeEach(function () {
      adminAgenciesView = new AdminAgenciesView();
      sinon.stub(adminMainView, 'initializeAdminAgenciesView', function () {
        adminMainView.adminAgenciesView = adminAgenciesView;
      });
      sinon.stub(adminAgenciesView, 'render');
    });

    describe('when user is not an admin', function () {
      beforeEach(function () {
        sinon.stub(adminMainView, 'isAdmin').returns(false);
      });

      afterEach(function () {
        adminMainView.isAdmin.restore();
      });

      describe('when user is an agency admin', function () {
        beforeEach(function () {
          sinon.stub(adminMainView, 'isAgencyAdmin').returns(true);
        });

        afterEach(function () {
          adminMainView.isAgencyAdmin.restore();
        });

        it('should render agency view by default', function () {
          adminMainView.routeTarget();
          assert(adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(adminAgenciesView.render.called, 'agency view rendered');
        });

        it('should allow agency view to be rendered explicitly', function () {
          adminMainView.routeTarget('agencies');
          assert(adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(adminAgenciesView.render.called, 'agency view rendered');
        });
      });

      describe('when user is not an agency admin', function () {
        // lack of authorization is handled after API calls fail
        beforeEach(function () {
          sinon.stub(adminMainView, 'isAgencyAdmin').returns(false);
        });

        afterEach(function () {
          adminMainView.isAgencyAdmin.restore();
        });

        it('should not render agency view by default', function () {
          adminMainView.routeTarget();
          assert(!adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(!adminAgenciesView.render.called, 'agency view rendered');
        });

        it('should allow agency view to be rendered explicitly', function () {
          adminMainView.routeTarget('agencies');
          assert(adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(adminAgenciesView.render.called, 'agency view rendered');
        });

      });
    });

    describe('when user is an admin', function () {
      beforeEach(function () {
        sinon.stub(adminMainView, 'isAdmin').returns(true);
      });

      afterEach(function () {
        adminMainView.isAdmin.restore();
      });

      describe('when user is an agency admin', function () {
        beforeEach(function () {
          sinon.stub(adminMainView, 'isAgencyAdmin').returns(true);
        });

        afterEach(function () {
          adminMainView.isAgencyAdmin.restore();
        });

        it('should not render agency view by default', function () {
          adminMainView.routeTarget();
          assert(!adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(!adminAgenciesView.render.called, 'agency view rendered');
        });

        it('should allow agency view to be rendered', function () {
          adminMainView.routeTarget('agencies');
          assert(adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(adminAgenciesView.render.called, 'agency view rendered');
        });
      });

      describe('when user is not an agency admin', function () {
        beforeEach(function () {
          sinon.stub(adminMainView, 'isAgencyAdmin').returns(false);
        });

        afterEach(function () {
          adminMainView.isAgencyAdmin.restore();
        });

        it('should not render agency view by default', function () {
          adminMainView.routeTarget();
          assert(!adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(!adminAgenciesView.render.called, 'agency view rendered');
        });

        it('should allow agency view to be rendered', function () {
          adminMainView.routeTarget('agencies');
          assert(adminMainView.initializeAdminAgenciesView.called, 'agency view initialized');
          assert(adminAgenciesView.render.called, 'agency view rendered');
        });
      });
    });
  });
});
