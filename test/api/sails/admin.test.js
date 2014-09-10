var assert = require('chai').assert;
var conf = require('./helpers/config');
var utils = require('./helpers/utils');
var request;

describe('admin:', function () {

  describe('not admin:', function () {
    before(function (done) {
      request = utils.init();
      utils.login(request, conf.defaultUser, function (err) {
        if (err) { return done(err); }
        done();
      });
    });

    it('set admin', function (done) {
      request.get({ url: conf.url + '/admin/admin/' + conf.defaultUser.obj.id + '?action=true'
                   }, function (err, response, body) {
        assert.equal(response.statusCode, 403);
        done(err);
      });
    });

    it('remove admin', function (done) {
      request.get({ url: conf.url + '/admin/admin/1?action=false'
                   }, function (err, response, body) {
        assert.equal(response.statusCode, 403);
        done(err);
      });
    });

    it('get users', function (done) {
      request.get({ url: conf.url + '/admin/users'
                   }, function (err, response, body) {
        assert.equal(response.statusCode, 403);
        done(err);
      });
    });
  });

  describe('admin:', function () {
    before(function (done) {
      request = utils.init();
      utils.login(request, conf.adminUser, function (err) {
        if (err) { return done(err); }
        done(err);
      });
    });

    it('set admin', function (done) {
      request.get({ url: conf.url + '/admin/admin/' + conf.defaultUser.obj.id + '?action=true'
                   }, function (err, response, body) {
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.equal(b.id, conf.defaultUser.obj.id);
        assert.isTrue(b.isAdmin);
        done(err);
      });
    });

    it('remove admin', function (done) {
      request.get({ url: conf.url + '/admin/admin/' + conf.defaultUser.obj.id + '?action=false'
                   }, function (err, response, body) {
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.equal(b.id, conf.defaultUser.obj.id);
        assert.equal(b.isAdmin, false);
        done(err);
      });
    });

    it('get users', function (done) {
      request.get({ url: conf.url + '/admin/users'
                   }, function (err, response, body) {
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.isDefined(b.page);
        assert.isDefined(b.count);
        assert.isDefined(b.limit);
        assert.isTrue(b.count > 0);
        done(err);
      });
    });

    it('search users', function (done) {
      request.post({ url: conf.url + '/admin/users',
                     form: { q: conf.defaultUser.username }
                   }, function (err, response, body) {
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.isDefined(b.page);
        assert.isDefined(b.count);
        assert.isDefined(b.limit);
        assert.isTrue(b.count > 0);
        assert.equal(b.users[0].username, conf.defaultUser.username);
        done(err);
      });
    });

    it('reset user password', function (done) {
      // create the test user
      utils.login(request, conf.testPasswordResetUser, function (err) {
        if (err) { return done(err); }
        // log back in as an administrator
        utils.login(request, conf.adminUser, function (err) {
          if (err) { return done(err); }
          // try to change the user's password
          request.post({ url: conf.url + '/user/resetPassword',
                         form: { id: conf.testPasswordResetUser.obj.id,
                          password: conf.testPasswordResetUser.newpassword }
                       }, function (err, response, body) {
            if (err) { return done(err); }
            assert.equal(response.statusCode, 200);
            var b = JSON.parse(body);
            assert.isTrue(b);
            // try to log in with the user's new password
            conf.testPasswordResetUser.password = conf.testPasswordResetUser.newpassword;
            utils.login(request, conf.testPasswordResetUser, function (err) {
              // if successful, err will be null
              return done(err);
            });
          });
        });
      });
    });

  });
});
