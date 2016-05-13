var assert = require('chai').assert;
var request = require('supertest');
var userFixtures = require('../../fixtures/user');
var taskFixtures = require('../../fixtures/task');

describe('AdminController', function() {
  describe('when not logged in', function() {
    it('shoud block access', function (done) {
      //TODO: should test all URLs here
      request(sails.hooks.http.app)
        .get('/api/admin/taskmetrics')
        .expect(403)
        .end(done)
    });
  });
  describe('when logged in as regular user', function() {
    var agent;
    var newUserAttrs;

    beforeEach(function(done) {
      newUserAttrs = (JSON.parse(JSON.stringify(userFixtures.minAttrs)));
      User.register(newUserAttrs, function(err, user) {
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

    it('shoud block access', function (done) {
      request(sails.hooks.http.app)
        .get('/api/admin/taskmetrics')
        .expect(403)
        .end(done)
    });

  });

  describe('when logged in as admin user', function() {
    var agent;
    var newUserAttrs;

    beforeEach(function(done) {
      newUserAttrs = (JSON.parse(JSON.stringify(userFixtures.minAttrs)));
      newUserAttrs.isAdmin = true;
      User.register(newUserAttrs, function(err, user) {
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

    it('should allow access', function (done) {
      // TODO: test all the URLs
      agent.get('/api/admin/taskmetrics')
        .expect(200)
        .end(done);
    });

    it('can set another user to be an admin', function(done) {
      newUserAttrs.username = "bob@usda.gov"
      newUserAttrs.isAdmin = false;
      User.register(newUserAttrs, function(err, user) {
        assert.isNull(err);
        agent.get("/api/admin/admin/"+user.id+"?action=true")
          .expect(200)
          .expect(function(res) {
            assert.isNotNull(res.body);
            assert.equal(res.body.username, newUserAttrs.username);
            assert.equal(res.body.isAdmin, true, 'isAdmin should be true');
          })
          .end(done);
      });
    });
    describe('/api/admin/tasks', function() {

      it('returns category lists', function (done) {
        agent.get('/api/admin/tasks')
          .expect(200)
          .expect(function(res) {
            assert.deepEqual(res.body, {
              assigned: [],
              completed: [],
              draft: [],
              open: [],
              submitted: []
            });
          })
          .end(done);
      });
      it('returns tasks in categories', function (done) {
        var keys = ['draft', 'submitted', 'open',
                             'assigned', 'completed', 'archived'];
        attrList = _.pick(taskFixtures, keys);
        attrList = _.values(attrList);
        Task.create(attrList)
        .then(function(tasks) {
          assert.equal(tasks.length, keys.length);
          agent.get('/api/admin/tasks')
            .expect(200)
            .expect(function(res) {
              var result = res.body;
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
            })
            .end(done);
        })
      });
    });

  });



});
