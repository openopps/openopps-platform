var assert = require('chai').assert;
var request = require('supertest');
var taskFixtures = require('../../fixtures/task');
var userFixtures = require('../../fixtures/user');

describe('TaskController', function() {
  describe('when not logged in,', function() {
    describe('api/task get', function() {
      var isZeroTasksResult = function(res) {
        assert.deepEqual(res.body,
          {
            tasks: []
          }
        )
      }

      it('with zero tasks, returns empty array', function (done) {
        request(sails.hooks.http.app)
          .get('/api/task')
          .expect(200)
          .expect(isZeroTasksResult)
          .end(done)
      });
      describe('with one task', function() {
        var user, task;
        beforeEach(function(done) {
          user = userFixtures.minAttrs;
          User.create(user).then(function(newUser) {
            user = newUser;
            return Task.create(taskFixtures.open);
          }).then(function(newTask) {
              task = newTask;
              done();
          }).catch(function(err) {
            done(err);
          })
        });

        it('/api/task returns a list of tasks', function (done) {
          request(sails.hooks.http.app)
            .get('/api/task')
            .expect(200)
            .expect(function(res) {
              assert.isNotNull(res.body);

              var tasks = res.body.tasks;
              assert.isNotNull(tasks);
              assert.equal(tasks.length, 1);
              assert.equal(tasks[0].state, 'open');
              assert.property(tasks[0], 'owner');
              assert.equal(tasks[0].owner.name, user.name);
            })
            .end(done)
        });
        it('/api/task/1 returns task 1', function (done) {
          request(sails.hooks.http.app)
            .get('/api/task/1')
            .expect(200)
            .expect(function(res) {
              var result = res.body;
              assert.isNotNull(result);
              assert.equal(result.id, 1);
              assert.equal(result.title, task.title);
              assert.equal(result.description, task.description);
              assert.equal(result.state, 'open');
              assert.property(result, 'owner');
              assert.equal(result.owner.name, user.name);
              assert.property(result, 'volunteers');
              assert.equal(result.volunteers.length, 0);
            })
            .end(done)
        });
        describe('with a volunteer', function() {
          var participant;
          beforeEach(function(done) {
            User.create(userFixtures.emmy)
            .then(function(newUser) {
              participant = newUser;
              return Volunteer.create({userId:newUser.id, taskId:task.id})
            })
            .then(function(newVol) {
              done();
            })
          })
          it('/api/task/1 returns task with volunteer', function (done) {
            request(sails.hooks.http.app)
              .get('/api/task/1')
              .expect(200)
              .expect(function(res) {
                var result = res.body;
                assert.isNotNull(result);
                assert.equal(result.id, 1);
                assert.property(result, 'volunteers');
                assert.equal(result.volunteers.length, 1);
                var vol = result.volunteers[0]
                assert.equal(vol.userId, participant.id);
                assert.equal(vol.name, participant.name);
                assert.property(vol, 'id');
              })
              .end(done)
          });
        })

      })
    });
    it('create is forbidden', function (done) {
      request(sails.hooks.http.app)
        .post('/api/task')
        .expect(403)
        .end(done)
    });
    it('update reports not found', function (done) {
      var taskAttrs = taskFixtures.draft;
      Task.create(taskAttrs)
      .then(function(newTask) {
        request(sails.hooks.http.app)
          .put('/api/task/1')
          .expect(403)
          .end(done)
      })
      .catch(done);
    });

  });
  describe('when logged in,', function() {

    var agent, loggedInUser;
    beforeEach(function(done) {
      var newUserAttrs = userFixtures.minAttrs;
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
    describe('create', function() {
      it('sets the owner to logged in user', function (done) {
        var taskAttrs = (JSON.parse(JSON.stringify(taskFixtures.draft)));
        taskAttrs.userId = 9999;
        agent.post('/api/task')
          .send(taskAttrs)
          .expect(201)
          .expect(function(res) {
            assert.equal(res.body.title, taskAttrs.title);
            assert.property(res.body, 'owner');
            assert.equal(res.body.owner.id, loggedInUser.id);
          })
          .end(done)
      });
    })
    it('update returns the new task', function (done) {
      var taskAttrs = taskFixtures.draft;
      Task.create(taskAttrs)
      .then(function(newTask) {
        agent.put('/api/task/1')
          .send(taskAttrs)
          .expect(200)
          .expect(function(res) {
            assert.equal(res.body.title, taskAttrs.title);
            assert.notProperty(res.body, 'volunteers');
          })
          .end(done)
      })
      .catch(done)
    });

  });
});
