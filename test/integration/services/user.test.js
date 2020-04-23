const _ = require('lodash');
const chai = require('chai');
const assert = chai.assert;
const userService = require('../../../api/user/service');

describe('User Service', () => {
  before(function (done) {
    // Wait for the service and data
    //  connection to fully initialize
    setTimeout(done, 500);
  });

  describe('.findOne', () => {
    it('should return truthy if user exist', async () => {
      var user = await userService.findOne(1);
      assert.isOk(user);
    });
    it('should return falsy if no user exist', async () => {
      var user = await userService.findOne(100);
      assert.isNotOk(user);
    });
  });

  describe('.findOneByUsername', () => {
    it('should return truthy if user exist', async () => {
      await userService.findOneByUsername('alan@test.gov', (err, user) => {
        assert.isOk(user);
      });
    });
    it('should return falsy if no user exist', async () => {
      await userService.findOneByUsername('NonexistentUsername', (err, user) => {
        assert.isNotOk(user);
      });
    });
  });

  describe('.getProfile', () => {
    it('should return a user profile', async () => {
      var user = await userService.getProfile(1);
      assert.isOk(user);
    });
    it('should return no user profile if none exist', async () => {
      var user = await userService.getProfile(100);
      assert.isNotOk(user);
    });
  });

  describe('.populateBadgeDescriptions', () => {
    var badgeDescriptions = require('../../../utils').badgeDescriptions;
    var badges = Object.keys(badgeDescriptions).map((key) => { 
      return { type: key }; 
    });
    it('All badge description should populate correctly', async () => {
      var results = await userService.populateBadgeDescriptions({ badges: badges });
      assert.isTrue(results.badges.reduce((a, b) => { 
        return a && b.description == badgeDescriptions[b.type]; 
      }, true));
    });
  });

  describe('.getActivities', () => {
    it('For user with id = 1 should return 1 created opportunity and 1 opportunity applied to', async () => {
      var activities = await userService.getActivities(1);
      assert.isTrue(activities.tasks.created.length == 1 && activities.tasks.volunteered.length == 1);
    });
    it('For user with id = 2 should return 0 created opportunity and 0 opportunity applied to', async () => {
      var activities = await userService.getActivities(2);
      assert.isTrue(activities.tasks.created.length == 0 && activities.tasks.volunteered.length == 0);
    });
  });

  describe('.canAdministerAccount', () => {
    it('Sitewide admins can administer any account', async () => {
      assert.isTrue(await userService.canAdministerAccount({ isAdmin: true }, { id: 5 }));
    });
    it('Agency admins can administer users within their agency', async () => {
      assert.isTrue(await userService.canAdministerAccount({ isAgencyAdmin: true, agencyId: 207 }, { id: 12 }));
    });
    it('Agency admins cannot administer users from another agency', async () => {
      assert.isFalse(await userService.canAdministerAccount({ isAgencyAdmin: true, agencyId: 207 }, { id: 10 }));
    });
    it('Agency admins cannot administer sitewide admins', async () => {
      assert.isFalse(await userService.canAdministerAccount({ isAgencyAdmin: true, agencyId: 207 }, { id: 5 }));
    });
    it('Standard user cannot administer another user', async () => {
      assert.isFalse(await userService.canAdministerAccount({ }, { id: 5 }));
    });
  });

  // describe('.[function]', () => {
  //   it('', async () => {
  //   });
  // });
});
