var assert = require('chai').assert;
var request = require('supertest');
var taskFixtures = require('../../fixtures/task');
var userFixtures = require('../../fixtures/user');

describe('VolunteerController', function() {
  describe('when not logged in,', function() {
    describe('api/volunteer', function() {
      it('create is forbidden', function (done) {
        request(sails.hooks.http.app)
          .post('/api/volunteer')
          .expect(403)
          .end(done)
      });
    });
  });
  describe('when logged in,', function() {
    var agent, loggedInUser, task;
    beforeEach(function(done) {
      var taskAttrs = taskFixtures.oneTimeOpen;
      var newUserAttrs = userFixtures.minAttrs;
      Task.create(taskAttrs)
      .then(function(newTask) {
        task = newTask;
        User.register(newUserAttrs, function(err, user) {
          assert.isNull(err);
          loggedInUser = user;
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
    });
    describe('create', function() {
      it('sets the owner to logged in user', function (done) {
        agent.post('/api/volunteer')
          .send({taskId: task.id})
          .expect(200)
          .expect(function(res) {
            console.log(res.body);
            assert.equal(res.body.taskId, task.id);
            assert.equal(res.body.userId, loggedInUser.id);
          })
          .end(done)
      });
    })
  });
});
