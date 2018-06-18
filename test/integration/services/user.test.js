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

  describe('.list', () => {
    it('should return 12 users', async () => {
      var users = await userService.list();
      assert.equal(users.length, 12);
    });
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

  // describe('.getActivities', () => {
  //   it('', async () => {
  //   });
  // });

  // describe('.[function]', () => {
  //   it('', async () => {
  //   });
  // });
});
