var assert = require('chai').assert;
var request = require('supertest');
var userFixtures = require('../../fixtures/user');

describe('AuthController', function() {
  var isValidLogoutConfirmation = function(res) {
    assert.deepEqual(res.body,
      {
        logout: true
      }
    )
  }
  describe('logout', function() {
    it('should return json confirmation', function (done) {
      request(sails.hooks.http.app)
        .post('/api/auth/logout')
        .send({json:true})
        .expect(200)
        .expect(isValidLogoutConfirmation)
        .end(done)
    });

    it('should redirect when not json', function (done) {
      request(sails.hooks.http.app)
        .post('/api/auth/logout')
        .send()
        .expect(302)
        .expect('location',sails.config.ui.home.logged_in_path, done);
    });

  });

  describe('local auth with no registered users', function() {
    var newUserAttrs;

    beforeEach(function(done) {
      // always copy newUserAttrs so we can change attributes in the tests
      newUserAttrs = (JSON.parse(JSON.stringify(userFixtures.minAttrs)));
      done();
    });

    var isValidMinUserResult = function(res) {
      assert.equal(res.body.name, userFixtures.minAttrs.name);
      assert.equal(res.body.username, userFixtures.minAttrs.username);
      assert.equal(res.body.isAdmin, false, 'isAdmin should be false');
      assert.equal(res.body.isAgencyAdmin, false, 'isAgencyAdmin should be false');
      assert.notProperty(res.body, 'password');
    }

    it('sign up should return json user', function (done) {
      newUserAttrs.json = true;
      request(sails.hooks.http.app)
        .post('/api/auth/local/register')
        .send(newUserAttrs)
        .expect(200)
        .expect(isValidMinUserResult)
        .end(done)
    });
    it('sign up should not allow admin', function (done) {
      newUserAttrs.json = true;
      newUserAttrs.isAdmin = true;
      newUserAttrs.isAgencyAdmin = true;
      request(sails.hooks.http.app)
        .post('/api/auth/local/register')
        .send(newUserAttrs)
        .expect(200)
        .expect(isValidMinUserResult)
        .end(done)
    });
    it('login should return json user', function (done) {
      User.register(newUserAttrs, function(err, user) {
        assert.isNull(err);
        request(sails.hooks.http.app)
          .post('/api/auth/local')
          .send({
            identifier: newUserAttrs.username,
            password: newUserAttrs.password,
            json: true
          })
          .expect(200)
          .expect(isValidMinUserResult)
          .end(done)
      })
    });
  });
  describe('with a registered user', function() {
    var user;
    beforeEach(function(done) {
      User.create(userFixtures.minAttrs)
      .then(function(newUser) {
          user = newUser;
          done();
      })
      .catch(done);
    });
    describe('forgot password', function() {
      it('should respond with success when email is valid', function (done) {
        request(sails.hooks.http.app)
          .post('/api/auth/forgot')
          .send({username: user.username})
          .expect(200)
          .expect(function(res) {
            assert.deepEqual(res.body, {
                  success:true,
                  email: user.username
            });
          })
          .end(done)
      });
      it('should report error when email is blank', function (done) {
        request(sails.hooks.http.app)
          .post('/api/auth/forgot')
          .send({username: ''})
          .expect(400)
          .expect(function(res) {
            assert.equal(res.body.message, 'You must enter an email address.');
          })
          .end(done)
      });
      it('should report error when email is invalid', function (done) {
        request(sails.hooks.http.app)
          .post('/api/auth/forgot')
          .send({username: 'foo'})
          .expect(400)
          .expect(function(res) {
            assert.equal(res.body.message, 'Please enter a valid email address.');
          })
          .end(done)
      });

    })
  });
});
