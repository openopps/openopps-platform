var chai = require('chai');
var assert = chai.assert;
var taskFixtures = require('../../fixtures/task');
var userFixtures = require('../../fixtures/user');
var _ = require('lodash');

describe('task.createAction', function() {
  var task;

  describe('draft task', function() {
    beforeEach(function(done) {
      Task.createAction(taskFixtures.draft).then(function(newTask) {
        task = newTask;
        done();
      })
      .catch(done);
    });
    it('creates the task', function(done) {
      assert.property(task, 'createdAt');
      assert.equal(task.title, taskFixtures.draft.title);
      assert.equal(task.description, taskFixtures.draft.description);
      done();
    });
    it('should notify task.create.draft', function (done) {
        Notification.find().limit(1).sort('id DESC')
        .then(function(notifications) {
          assert.equal(notifications.length, 1, 'a notification should have been found');
          assert.equal(notifications[0].action, 'task.create.draft');
          assert.equal(notifications[0].model.title, task.title);
          done();
        }).catch(done);
    });
  });
  describe('submitted task', function() {
    beforeEach(function(done) {
      Task.createAction(taskFixtures.oneTimeSubmitted).then(function(newTask) {
        task = newTask;
        done();
      })
      .catch(done);
    });
    it('should notify task.create.thanks', function(done) {
      Notification.find().limit(1).sort('id DESC')
      .then(function(notifications) {
        assert.equal(notifications.length, 1, 'notifications should have been found');
        assert.equal(notifications[0].action, 'task.create.thanks');
        assert.equal(notifications[0].model.title, task.title);
        done();
      });
    });
  });
});
