var chai = require('chai');
var assert = chai.assert;
chai.use(require('chai-datetime'));
var users = require('../../fixtures/user');

describe('UserModel', function() {
  var createAttrs, expectedAttrs;
  beforeEach(function(done) {
    createAttrs = (JSON.parse(JSON.stringify(users.allAttrs)));
    createAttrs.username.toUpperCase();   // shouldn't matter, saves as lower
    expectedAttrs = (JSON.parse(JSON.stringify(users.allAttrs)));
    expectedAttrs.id = 1;
    delete expectedAttrs.password;
    done();
  })

  describe('new user', function() {
    var newUser = {};
    beforeEach(function(done) {
      User.create(createAttrs)
      .then(function(result) {
          newUser = result;
          done();
      })
      .catch(done);
    });
    describe('#create', function() {
      it('should have username', function (done) {
          assert.equal(newUser.username, expectedAttrs.username);
          done();
      });
      it('should have name', function (done) {
          assert.equal(newUser.name, expectedAttrs.name);
          done();
      });
      it('should not have password', function (done) {
          // this is really testing that random attributes are not saved
          assert.notProperty(newUser, 'password');
          done();
      });
      it('should have zero passports', function (done) {
          assert.equal(newUser.passports.length, 0);
          done();
      });
      describe('errors:', function() {
        it('should fail with duplicate username (email)', function() {
          User.create({username: createAttrs.username}, function(err, records) {
            assert.isNotNull(err, 'expect an error from User.create');
            assert.equal(err.code, 'E_VALIDATION');
            done();
          });
        });
      });
    });
    describe('#toJSON', function() {
      it('has created date', function (done) {
        assert.instanceOf(newUser.createdAt, Date);
        done();
      });
      it('has updated same as created', function (done) {
        assert.equalDate(newUser.updatedAt, newUser.createdAt);
        done();
      });
      it('has expected properties', function (done) {
          newUserAttrs = newUser.toJSON()
          delete newUserAttrs.createdAt // tested above
          delete newUserAttrs.updatedAt // tested above
          assert.deepEqual(newUserAttrs, expectedAttrs);
          done();
      });
    });
    describe('#forgotPassword', function() {
      xit('creates password reset', function (done) {
        User.forgotPassword(createAttrs.username)
        .then(function(token) {
          assert.isNotNull(token)
        })
        done();
      });
    });
  }); // 'new user'

  describe('#register', function() {
    describe('with valid params', function() {
      var user;
      beforeEach(function(done) {
        User.register(createAttrs, function(err, record) {
          assert.isNull(err)
          user = record;
          done();
        });
      });
      describe('result', function() {
        it ('should have correct attributes', function(done) {
          assert.equal(user.username, createAttrs.username);
          assert.equal(user.name, createAttrs.name);
          done();
        });
      });
      it('should create a user', function (done) {
          User.find({username: createAttrs.username})
          .exec(function(err, records) {
            if (err) done(err);
            assert.equal(records.length, 1);
            found_user = records[0]
            assert.equal(found_user.username, createAttrs.username);
            assert.equal(found_user.name, createAttrs.name);
            done();
          });
      });
      it('should create a passport', function (done) {
          Passport.find({user: user.id})
          .exec(function(err, records) {
            if (err) done(err);
            assert.equal(records.length, 1);
            passport = records[0]
            assert.equal(passport.user, 1);
            assert.equal(passport.protocol, 'local');

            done();

          });
      });
      it('should create a user with a passport', function (done) {
          User.find({username: createAttrs.username})
          .populate('passports')
          .exec(function(err, records) {
            if (err) done(err);
            assert.equal(records.length, 1);
            found_user = records[0]
            assert.equal(found_user.passports.length, 1);
            done();

          });
      });
      it('should notify user.create.welcome', function (done) {
          Notification.find().limit(1).sort('id DESC')
          .then(function(notifications) {
            assert.equal(notifications.length, 1, 'a notification should have been generated');
            assert.equal(notifications[0].action, 'user.create.welcome');
            assert.equal(notifications[0].model.username, user.username);
            done();
          }).catch(done);
      });
    });
    describe('with invalid params', function() {
      it ('should fail with invalid user name', function(done) {
        createAttrs.username = "foo"; // should be an email address
        User.register(createAttrs, function(err, record) {
          assert.isNotNull(err)
          done();
        });
      });
      it ('should fail with no password', function(done) {
        createAttrs.password = ""; // should be an email address
        User.register(createAttrs, function(err, record) {
          assert.isNotNull(err)
          done();
        });
      });
      it ('should require password of 8 chars', function(done) {
        createAttrs.password = "1234567"; // should be an email address
        User.register(createAttrs, function(err, record) {
          assert.isNotNull(err)
          done();
        });
      });

    });

  });
});
