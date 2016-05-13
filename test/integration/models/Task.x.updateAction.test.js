var chai = require('chai');
var assert = chai.assert;
var taskFixtures = require('../../fixtures/task');
var userFixtures = require('../../fixtures/user');
var _ = require('lodash');

describe('task.updateAction', function() {
  var task;

  describe('draft task', function() {
    beforeEach(function(done) {
      Task.create(taskFixtures.draft).then(function(newTask) {
        task = newTask;
        done();
      })
      .catch(done);
    });
    it('submitted sets submittedAt', function(done) {
      task.updateAction({state: 'submitted'})
      .then(function(updatedTask) {
        var submittedAt;
        assert.property(updatedTask, 'submittedAt');
        submittedAt = new Date(updatedTask.submittedAt);
        assert.isTrue(submittedAt <= new Date(), 'submittedAt not set');

        done();
      });
    });
  });
  describe('submitted task', function() {
    var user;
    beforeEach(function(done) {
      User.create(userFixtures.minAttrs)
      .then(function(newUser) {
        user = newUser;
        Task.create(taskFixtures.oneTimeSubmitted).then(function(newTask) {
          task = newTask;
          done();
        })
        .catch(done);
      });
    });
    describe('when opened', function() {
      var openedTask;
      beforeEach(function(done) {
        task.updateAction({state: 'open'})
        .then(function(updatedTask) {
          openedTask = updatedTask;
          done();
        });
      })
      it('sets publishedAt', function(done) {
        assert.property(openedTask, 'publishedAt');
        assert.isTrue(new Date(openedTask.publishedAt) <= new Date(),
                      'publishedAt not valid');
        done();
      });
      it('should create update and badge events', function(done) {
        Notification.find().limit(2).sort('id DESC')
        .then(function(notifications) {
          console.log('notifications', notifications);
          assert.equal(notifications.length, 2, 'notifications should have been found');
          assert.equal(notifications[0].action, 'badge.create.owner');
          assert.equal(notifications[0].model.badge.type, 'instigator');
          assert.equal(notifications[1].action, 'task.update.opened');
          assert.equal(notifications[1].model.title, task.title);
          // assert.equal(notifications[1].model.title, task.title);
          done();
        });
      });
    });
  });


});
