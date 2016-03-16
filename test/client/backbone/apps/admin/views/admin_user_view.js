var assert = require('chai').assert;
var sinon = require('sinon');
var AdminUserView = require('../../../../../../assets/js/backbone/apps/admin/views/admin_user_view.js');
var jquery = require('jquery');
// Expose jQuery to views, which currently assume it exists on global window object
window.$ = jquery;

describe('AdminUserView', function () {
  var clickEvent, button, adminUserView;
  beforeEach(function () {
    adminUserView = new AdminUserView();
    var table = jquery('<table><tr data-id="1"><td><button/></td></tr></table>');
    button = table.find('button')[0];
    clickEvent = {
      currentTarget: button,
      preventDefault: sinon.spy(),
    };
    sinon.stub(adminUserView, 'updateUser');
  });

  describe('agencyAdminCreate', function () {
    it('should update the user with the isAgencyAdmin flag', function () {
      adminUserView.agencyAdminCreate(clickEvent);
      assert.equal(adminUserView.updateUser.firstCall.args[0][0], button, 'button clicked');
      assert.equal(adminUserView.updateUser.firstCall.args[1].id, '1', 'user id');
      assert.equal(adminUserView.updateUser.firstCall.args[1].isAgencyAdmin, true, 'isAgencyAdmin flag');
      assert.equal(adminUserView.updateUser.firstCall.args[1].url, '/api/admin/agencyAdmin/1?action=true', 'url to request');
    });
  });

  describe('agencyAdminRemove', function () {
    it('should remove the isAgencyAdmin flag from the user', function () {
      adminUserView.agencyAdminRemove(clickEvent);
      assert.equal(adminUserView.updateUser.firstCall.args[0][0], button, 'button clicked');
      assert.equal(adminUserView.updateUser.firstCall.args[1].id, '1', 'user id');
      assert.equal(adminUserView.updateUser.firstCall.args[1].isAgencyAdmin, false, 'isAgencyAdmin flag');
      assert.equal(adminUserView.updateUser.firstCall.args[1].url, '/api/admin/agencyAdmin/1?action=false', 'url to request');
    });
  });
});
