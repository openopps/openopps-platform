const _ = require('lodash');
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-datetime'));
const users = require('../../fixtures/user');
const User = require('../../../api/model').User;

const isURIUsed = (id, uri) => {
  return Object.keys(users).filter(key => {
    var user = users[key];
    return user.id !== id && user.uri === uri;
  });
};

describe('UserModel', function () {
  var createAttrs, expectedAttrs;
  beforeEach(function () {
    createAttrs = (JSON.parse(JSON.stringify(users.allAttrs)));
    createAttrs.uri.toUpperCase();   // shouldn't matter, saves as lower
    expectedAttrs = (JSON.parse(JSON.stringify(users.allAttrs)));
    expectedAttrs.id = 1;
    delete expectedAttrs.password;
  });

  describe('new user', function () {
    var user = {};
    beforeEach(function () {
      user = User.create(createAttrs);
    });
    describe('#create', function () {
      it('should have uri', function () {
        assert.equal(user.uri, expectedAttrs.uri);
      });
      it('should have name', function () {
        assert.equal(user.name, expectedAttrs.name);
      });
      it('should not be an admin', function () {
        assert.equal(user.isAdmin, false);
      });
      it('should not be an agency admin', function () {
        assert.equal(user.isAgencyAdmin, false);
      });
      it('should not be disabled', function () {
        assert.equal(user.disabled, false);
      });
      it('should not have any completed tasks', function () {
        assert.equal(user.completedTasks, 0);
      });
      it('should not have any failed login attempts', function () {
        assert.equal(user.passwordAttempts, 0);
      });
    });
  });

  describe('.validateUser', function () {
    var user = {};
    beforeEach(function () {
      user = User.create(createAttrs);
    });
    it('a valid user should have no errors', async () => {
      errors = await User.validateUser(user, isURIUsed);
      assert.equal(_.isEmpty(errors.invalidAttributes), true);
    });
    it('a user with an invalid uri should have email errors', async () => {
      user.uri = 'notvalid@email';
      errors = await User.validateUser(user, isURIUsed);
      assert.equal((errors.invalidAttributes.email || []).length > 0, true);
    });
    it('a user with a <> in the uri should have multiple email errors', async () => {
      user.uri = 'some<evil>@email.com';
      errors = await User.validateUser(user, isURIUsed);
      assert.equal((errors.invalidAttributes.email || []).length > 1, true);
    });
    it('a user attempting to use an existing uri should have email errors', async () => {
      user.uri = users.emmy.uri;
      errors = await User.validateUser(user, isURIUsed);
      assert.equal((errors.invalidAttributes.email || []).length > 0, true);
    });
    it('a user with a uri longer than 60 should have email errors', async () => {
      user.uri = 'mySuperReallyReallyReallyReallyReallyReallyLongEmail@address.com';
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.email || []).length > 0, true);
    });
    it('a user with <> in bio should have bio errors', async () => {
      user.bio = '<script>My evil script.</script>';
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.bio || []).length > 0, true);
    });
    it('a user with <> in name should have name errors', async () => {
      user.name = '<script>My evil script.</script>';
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.name || []).length > 0, true);
    });
    it('a user with a name longer than 60 should have name errors', async () => {
      user.name = 'my super really really really really really really really long name';
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.name || []).length > 0, true);
    });
    it('a user with <> in title should have title errors', async () => {
      user.title = '<script>My evil script.</script>';
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.title || []).length > 0, true);
    });
    it('a user with a title longer than 150 should have title errors', async () => {
      user.title = 'A super duper really really really really really really ' +
        'obnoxiously long title for a user that exceeds the length limit and ' +
        'will not fit into the title column in our database table';
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.title || []).length > 0, true);
    });
    it('a user with <> in a tag should have tag errors', async () => {
      user.tags = [{ type: 'skill', name: '<script>My evil script.</script>'}];
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.tag || []).length > 0, true);
    });
    it('a user with an invalid tag type should have tag errors', async () => {
      user.tags = [{ type: 'invalid-type', name: 'tagName'}];
      errors = await User.validateUser(user, () => { return false; });
      assert.equal((errors.invalidAttributes.tag || []).length > 0, true);
    });
  });
});
