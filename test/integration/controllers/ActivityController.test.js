var _ = require('lodash');
var assert = require('chai').assert;
var request = require('supertest');
var resAssert = require('./resAssert');

describe('ActivityController', function() {
  var user;
  var agent;

  beforeEach(function(done) {
    user = require('../../fixtures/user').minAttrs;
    var newUserAttrs = user;

    User.register(user, function(err, createdUser) {
      user = createdUser;
      assert.isNull(err);
      agent = request.agent(sails.hooks.http.app);
      agent.post('/api/auth/local')
        .send({
          identifier: newUserAttrs.username,
          password: newUserAttrs.password,
          json: true
        })
        .expect(200)
        .end(done)
    });
  });

  describe('api/activity/badges', function() {
    it('should return an empty list when the user has no badges', function(done) {
      agent.get('/api/activity/badges')
        .expect(200)
        .expect(function(res) {
          assert.deepEqual(res.body, []);
        })
        .end(done)
    });

    it('should return a list containing recent badges for a task', function(done) {
      var task, emmy;
      var emmyAttrs = require('../../fixtures/user').emmyAttrs;

      Task.create({'userId': user.id}).then(function(newTask) {
        task = newTask;
        return User.create(emmyAttrs)
      })
      .then(function(newUser) {
        emmy = newUser
        return Volunteer.create({userId:emmy.id, taskId:task.id})
      })
      .then(function(newVolunteer) {
        Task.update(task.id, {id: task.id, state: 'completed'}).exec(function (err, updated_task) {
          user.completedTasks = 1;

          Badge.awardForTaskCompletion(task, user, function(err, badges) {
            assert.isNull(err);
            agent.get('/api/activity/badges')
              .expect(200)
              .expect(function(res) {
                assert.equal(res.body.length, 1);
                assert.equal(res.body[0].badges.length, 1, "there should be one badge");
                assert.equal(res.body[0].participants.length, 1, "there should be one participant");
              })
              .end(done)
          });
        });
      });
    });
  });
});
