var assert = require('chai').assert;
var conf = require('./helpers/config');
var utils = require('./helpers/utils');
var request;

describe('like:', function() {

  var publicProject, draftProject;

  var publicLike;

  before(function(done) {
    request = utils.init();
    utils.login(request, function(err) {
      utils.createProject(request, true, function (err, proj) {
        if (err) { return done(err); }
        publicProject = proj;
        utils.createProject(request, false, function (err, proj) {
          draftProject = proj;
          done(err);
        });
      });
    });
  });

  describe('logged in:', function() {

    it('create', function (done) {
      var like = { projectId: publicProject.id };
      request.post({ url: conf.url + '/like',
                     body: JSON.stringify(like)
                   }, function(err, response, body) {
        if (err) { return done(err); }
        // should be 201, Sails .10 currently returns 200. https://github.com/balderdashy/sails/issues/1840
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        // check that the values passed in are the same as those passed back
        assert.equal(b.projectId, publicProject.id);
        assert.notEqual(b.userId, null);
        publicLike = b;
        done();
      });
    });

    it('like', function (done) {
      request.get({ url: conf.url + '/like/like/' + draftProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          var b = JSON.parse(body);
          // check that the values passed in are the same as those passed back
          assert.equal(b.projectId, draftProject.id);
          assert(b.userId);
          done();
      });
    });

    it('likeu', function (done) {
      request.get({ url: conf.url + '/like/likeu/' + draftProject.owners[0].userId },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          var b = JSON.parse(body);
          // check that the values passed in are the same as those passed back
          assert.equal(b.userId, draftProject.owners[0].userId);
          assert.equal(b.targetId, draftProject.owners[0].userId);
          assert(b.id);
          done();
      });
    });

    it('find: no parameter', function (done) {
      request.get({ url: conf.url + '/like' }, function (err, response, body) {
        if (err) { return done(err); }
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.equal(b.length, 3);
        for (var i = 0; i < b.length; i++) {
          assert(b[i].id);
          assert(b[i].projectId || b[i].targetId);
        }
        done();
      });
    });

    it('find: specific project', function (done) {
      request.get({ url: conf.url + '/like/find/' + publicProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          var b = JSON.parse(body);
          assert(b);
          done();
      });
    });

    it('unlike', function (done) {
      // Unlike
      request.get({ url: conf.url + '/like/unlike/' + draftProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          // Check if it is unliked.
          request.get({ url: conf.url + '/like/find/' + draftProject.id },
            function (err, response, body) {
              if (err) { return done(err); }
              assert.equal(response.statusCode, 200);
              var b = JSON.parse(body);
              assert(!b);
              done();
          });
      });
    });

    it('unlikeu', function (done) {
      // Unlike
      request.get({ url: conf.url + '/like/unlikeu/' + draftProject.owners[0].userId },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          // Check if it is unliked.
          request.get({ url: conf.url + '/like/find/' + draftProject.owners[0].userId + '?type=user' },
            function (err, response, body) {
              if (err) { return done(err); }
              assert.equal(response.statusCode, 200);
              var b = JSON.parse(body);
              assert(!b);
              done();
          });
      });
    });

  });

  describe('logged out:', function() {

    before(function() {
      request = utils.init(true);
    });

    it('count', function (done) {
      request.get({ url: conf.url + '/like/count/' + publicProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          var b = JSON.parse(body);
          assert.equal(b.projectId, publicProject.id);
          assert.equal(b.count, 1);
          done();
      });
    });

    it('count denied', function (done) {
      request.get({ url: conf.url + '/like/count/' + draftProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 403);
          done();
      });
    });

    it('find denied', function (done) {
      request.get({ url: conf.url + '/like/' },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 403);
          done();
      });
    });

    it('find :id denied', function (done) {
      request.get({ url: conf.url + '/like/find/' + publicProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 403);
          done();
      });
    });

    it('like denied', function (done) {
      request.get({ url: conf.url + '/like/like/' + publicProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 403);
          done();
      });
    });

    it('unlike denied', function (done) {
      request.get({ url: conf.url + '/like/unlike/' + publicProject.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 403);
          done();
      });
    });

  });

});
