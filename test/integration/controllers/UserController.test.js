var _ = require('lodash');
var assert = require('chai').assert;
var request = require('supertest');
var resAssert = require('./resAssert');
var userFixtures = require('../../fixtures/user');

describe('UserController', function() {
  var users;  // user fixtures loaded fresh for each test
  var newUserAttrs;
  var loggedInUser;

  beforeEach(function(done) {
    newUserAttrs = (JSON.parse(JSON.stringify(userFixtures.minAttrs)));
    User.register(newUserAttrs, function(err, user) {
      loggedInUser = user;
      assert.isNull(err);
      done();
    })
  });

  describe('getting user info', function() {
    describe('when not logged in', function() {
      it('should be forbidden', function (done) {
        request(sails.hooks.http.app)
          .get('/api/user')
          .expect(403)
          .expect(resAssert.isEmptyObject)
          .end(done)
      });
    });

    describe('when logged in', function() {

      var agent;
      beforeEach(function(done) {
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
      it('should return current user info', function (done) {
        agent.get('/api/user')
          .expect(200)
          .expect(function(res) {
            assert.equal(res.body.username, newUserAttrs.username);
            assert.equal(res.body.name, newUserAttrs.name);
            assert.equal(res.body.id, 1);
            assert.equal(res.body.isOwner, true);
            assert.isUndefined(res.body['password']);
            assert.property(res.body, 'tags');
            assert.property(res.body, 'badges');
          })
          .end(done)
      });
      it('should set owner correctly when id is given', function (done) {
        assert.property(loggedInUser, 'id');
        agent.get('/api/user/'+loggedInUser.id)
          .expect(200)
          .expect(function(res) {
            assert.equal(res.body.username, newUserAttrs.username);
            assert.equal(res.body.name, newUserAttrs.name);
            assert.equal(res.body.id, 1);
            assert.equal(res.body.isOwner, true);
            assert.isUndefined(res.body['password']);
            assert.property(res.body, 'tags');
            assert.property(res.body, 'badges');
          })
          .end(done)
      });
    });
  });

  describe('/api/user/activities', function() {
    describe('when not logged in', function() {
      it('should be forbidden', function (done) {
        request(sails.hooks.http.app)
          .get('/api/user/activities')
          .expect(403)
          .expect(resAssert.isEmptyObject)
          .end(done)
      });
    });

    describe('when logged in', function() {

      var agent;
      beforeEach(function(done) {
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
      it('empty activities for new user', function (done) {
        agent.get('/api/user/activities')
          .expect(200)
          .expect(function(res) {
            assert.deepEqual(res.body, {
              tasks:{
                created:[],
                volunteered:[]
              }
            });
          })
          .end(done)
      });
      describe('for user with tasks', function() {
        var userTasks = ['draft', 'submitted', 'open',
                             'assigned', 'completed', 'archived'];
        beforeEach(function(done) {
          var taskFixtures = require('../../fixtures/task');
          attrList = _.pick(taskFixtures, userTasks);
          attrList = _.values(attrList);
          Task.create(attrList, function(tasks, err) {
            assert.isNotNull(err);
            done();
          });
        });
        it('reports correct tasks', function (done) {
          agent.get('/api/user/activities')
            .expect(200)
            .expect(function(res) {
              assert.isNotNull(res.body);
              assert.isNotNull(res.body.tasks);
              assert.isNotNull(res.body.tasks.created);
              assert.deepEqual(res.body.tasks.created.length, userTasks.length);
            })
            .end(done)
          });
      });
    });
  });


  describe('/api/user/username', function() {

    describe('invalid new user ID:', function() {
      it('existing user', function (done) {
        request(sails.hooks.http.app)
          .post('/api/user/username/'+newUserAttrs.username)
          .expect(200)
          .expect(resAssert.isTrue)
          .end(done)
      });

      it('existing user with different case', function (done) {
        uppercaseUsername = newUserAttrs.username.toUpperCase();
        request(sails.hooks.http.app)
          .post('/api/user/username/'+uppercaseUsername)
          .expect(200)
          .expect(resAssert.isTrue)
          .end(done)
      });
      it('empty string should', function (done) {
        request(sails.hooks.http.app)
          .post('/api/user/username/')
          .expect(200)
          .expect(resAssert.isTrue)
          .end(done)
      });
      it('non-email string should return false', function (done) {
        request(sails.hooks.http.app)
          .post('/api/user/username/foo')
          .expect(200)
          .expect(resAssert.isTrue)
          .end(done)
      });
    });

    it('should return false if valid email & no user exists', function (done) {
      request(sails.hooks.http.app)
        .post('/api/user/username/foo@bar.gov')
        .expect(200)
        .expect(resAssert.isFalse)
        .end(done)
    });

  });
});
