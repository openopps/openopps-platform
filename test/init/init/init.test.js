var assert = require('chai').assert;
var _ = require('underscore');
var async = require('async');
var conf = require('./config');
var utils = require('../../demo/data/utils');
var request;

describe('init:', function() {

  before(function(done) {
    console.log('hello');
    request = utils.init();
    done();
  });

  it('tags', function (done) {
    var process = function (tag, done) {
      utils.tag_find(request, tag.name, tag.type, function (err, t) {
        if (err) return done(err);
        // if tag exists, just update it with the tag id
        if (t) {
          tag.obj = t;
          tag.id = t.id;
          return done(err);
        }
        utils.tag_add(request, tag, function (err, t) {
          tag.obj = t;
          tag.id = t.id;
          return done(err);
        });
      });
    };

    utils.login(request, conf.user.username, conf.user.password, function (err) {
      if (err) return done(err);
      async.eachSeries(conf.tags, process, function (err) {
        done(err);
      });
    });
  });

  after(function(done) {
    utils.user_info(request, function (err, user) {
      if (err) return done(err);
      utils.user_disable(request, user, function (err, user) {
        done(err);
      });
    })
  });

});
