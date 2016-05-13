var chai = require('chai');
var assert = chai.assert;
var taskFixtures = require('../../fixtures/task');
var userFixtures = require('../../fixtures/user');
var _ = require('lodash');

describe('Task#byCategory', function() {
  var task;
  describe('with no tasks', function() {
    it('returns correct categories', function(done) {
      Task.byCategory().then(function(result) {
        assert.deepEqual(result, {
          assigned: [],
          completed: [],
          draft: [],
          open: [],
          submitted: []
        });
        done();
      })
      .catch(function (err) {
        done(err);
      });
    });
  });
  describe('with draft task', function() {
    beforeEach(function(done) {
      User.create(userFixtures.minAttrs).then(function(user) {
        return Task.create(taskFixtures.draft);
      }).then(function(tasks) {
          done();
      }).catch(function(err) {
        done(err);
      })
    });
    it('returns task correctly', function(done) {
      Task.byCategory().then(function(result) {
        assert.equal(result.draft.length, 1);
        assert.equal(result.draft[0].state, 'draft');
        assert.isNotNull(result.draft[0].user);
        done();
      })
      .catch(function (err) {
        done(err);
      });
    });

  });
  describe('with signups', function() {
    var users, tasks;
    beforeEach(function(done) {
      userAttrs = [userFixtures.minAttrs, userFixtures.emmy, userFixtures.alan]
      User.create(userAttrs).then(function(newUsers) {
        users = newUsers;
        return Task.create([taskFixtures.open, taskFixtures.assigned]);
      }).then(function(tasks) {
        return Volunteer.create({taskId:tasks[0].id, userId:users[1].id})
      }).then(function(vols) {
        done();
      }).catch(function(err) {
        done(err);
      })
    });
    it('returns task correctly', function(done) {
      Task.byCategory().then(function(result) {
        console.log('Task.byCategory result', result);
        assert.equal(result.open.length, 1);
        assert.property(result.open[0], 'volunteers');
        assert.equal(result.open[0].volunteers.length, 1);
        assert.equal(result.open[0].volunteers[0].name, users[1].name);
        assert.equal(result.assigned.length, 1);
        done();
      })
      .catch(function (err) {
        done(err);
      });
    });
  });
  describe('with tasks in each category', function() {
    beforeEach(function(done) {
      User.create(userFixtures.minAttrs).then(function(user) {
        var keys = ['draft', 'submitted', 'open',
                             'assigned', 'completed', 'archived'];
        attrList = _.pick(taskFixtures, keys);
        attrList = _.values(attrList);
        return Task.create(attrList);
      }).then(function(tasks) {
          done();
      }).catch(function(err) {
        done(err);
      })
    });
    it('returns tasks in correct categories', function(done) {
      Task.byCategory().then(function(result) {
        assert.equal(result.draft.length, 1);
        assert.equal(result.draft[0].state, 'draft');
        assert.equal(result.submitted.length, 1);
        assert.equal(result.submitted[0].state, 'submitted');
        assert.equal(result.open.length, 1);
        assert.equal(result.open[0].state, 'open');
        assert.equal(result.assigned.length, 1);
        assert.equal(result.assigned[0].state, 'assigned');
        assert.equal(result.completed.length, 1);
        assert.equal(result.completed[0].state, 'completed');
        done();
      })
      .catch(function (err) {
        done(err);
      });
    });
  });
});
