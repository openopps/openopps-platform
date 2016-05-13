var chai = require('chai');
var assert = chai.assert;
var taskFixtures = require('../../fixtures/task');
var userFixtures = require('../../fixtures/user');
var _ = require('lodash');

describe('Task model', function() {
  var task;

  describe('default properties', function() {
    beforeEach(function(done) {
      Task.create({}).then(function(newTask) {
        task = newTask;
        done();
      })
      .catch(done);
    });
    describe('attributes', function() {
      it('owner may be null', function(done) {
        // in the UI there is always a user who creates the task
        // some imported tasks may not have this data
        assert.equal(task.owner, null);
        done();
      });

      it('state default to configured state', function(done) {
        assert.equal(task.state, sails.config.taskState, 'badge should default to configured state');
        done();
      });
      it('publishedAt defaults to nil', function(done) {
        assert.equal(task.publishedAt, null, 'publishedAt defaults to null');
        done();
      });
      it('assignedAt defaults to nil', function(done) {
        assert.equal(task.assignedAt, null, 'assignedAt defaults to null');
        done();
      });
      it('completedAt defaults to nil', function(done) {
        assert.equal(task.completedAt, null, 'completedAt defaults to null');
        done();
      });
      it('submittedAt defaults to nil', function(done) {
        assert.equal(task.submittedAt, null, 'submittedAt defaults to null');
        done();
      });

    });

  });

  describe('.authorized', function() {
    describe('without user', function() {
      it('draft and submitted tasks are hidden', function(done) {
        _(['draft', 'submitted'])
          .forEach(function(state) {
            // we have a fixture named for each state
            var task = new Task._model(taskFixtures[state]);
            result = task.authorized(null);
            assert.equal(result, null, "for state "+state);
          })
        done();
      });
      it('public tasks are visible', function(done) {
        _(['open', 'assigned', 'completed', 'archived'])
          .forEach(function(state) {
            // we have a fixture named for each state
            var task = new Task._model(taskFixtures[state]);
            result = task.authorized(null);
            assert.equal(result, task);
          })
        done();
      });
    });
    describe('with user not owner', function() {
      var owner, user;
      beforeEach(function(done) {
        owner = 1;
        User.create(userFixtures.minAttrs)
        .then(function() {
          done();
        });
      });
      it('draft tasks are hidden', function(done) {
        Task.create(taskFixtures.draft)
        .then(function(task) {
          task.userId = owner;
          result = task.authorized(user);
          assert.equal(result, null);
          done();
        })
      });
    });
    describe('with user owner', function() {
      var owner, user;
      beforeEach(function(done) {
        User.create(userFixtures.minAttrs)
        .then(function(newUser) {
          user = newUser;
          done();
        })
        .catch(done);
      });
      it('draft tasks are visible', function(done) {
        Task.create(taskFixtures.draft)
        .then(function(newTask) {
          result = newTask.authorized(user);
          assert.equal(result, newTask);
          done();
        })
        .catch(done);
      });
    });

  });
  describe('#authorized', function() {
    var task, user;
    beforeEach(function(done) {
      User.create(userFixtures.minAttrs)
      .then(function(newUser) {
        user = newUser;
        return Task.create(taskFixtures.open)
      })
      .then(function(newTask) {
        task = newTask;
        done();
      })
      .catch(done)
    });
    it('returns the authorized task', function(done) {
      Task.authorized(task.id, user, function(err, result) {
        assert.isNull(err);
        assert.isNotNull(result);
        assert.equal(result.id, task.id);
        assert.equal(result.isOwner, true);
        done();
      });
    });
  });
  describe('owner attribute', function() {
    var task;
    beforeEach(function(done) {
      User.create(userFixtures.minAttrs).then(function(user) {
        return Task.create(taskFixtures.draft);
      })
      .then(function() {
        return Task.findOne({id: 1}).populate('owner');
      })
      .then(function(newTask) {
        task = newTask;
        done();
      })
      .catch(function(err) {
        done(err);
      })
    });

    it('populates object with correct data', function(done) {
      assert.property(task, 'owner');
      assert.equal(task.owner.username, userFixtures.minAttrs.username);
      done();
    });

  });
});
