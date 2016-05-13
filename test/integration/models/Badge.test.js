var assert = require('chai').assert;
var users = require('../../fixtures/user');
var tasks = require('../../fixtures/task');
var sinon = require('sinon');

describe('BadgeModel', function() {
  var user;

  beforeEach(function(done){
    // all models are reloaded in bootstrap
    Notification._transport.sendMail = function(options, cb) {
      console.log('fake send mail')
      cb();
    };

    User.create(users.minAttrs).exec(function createCB(err, newUser){
      user = newUser;
      done(err);
    });
  });

  describe('#awardForTaskCompletion()', function() {
    var task;

    beforeEach(function(done) {
      task = { id:1 };
      done();
    });

    describe('no tasks', function() {
      it('should not award a badge', function (done) {
        Badge.awardForTaskCompletion(task, user, function(err, badges) {
          assert.equal(badges.length, 0, 'badge should not be created');
          done();
        });
      });
    });

    describe('1 task', function() {
      it('should award a badge', function (done) {
        user.completedTasks = 1;
        user.save(function(err, u) {    // TODO: u is undefined
          if (err) done(err);
          Badge.awardForTaskCompletion(task, user, function(err, badges) {
            assert.equal(badges.length, 1, 'badge should be created');
            done();
          });
        });
      });
    });

    describe('2 tasks', function() {
      it('should not award a new badge', function (done) {
        user.completedTasks = 2;
        user.save(function(err, u) {  // TODO: u is undefined
          if (err) done(err);
          Badge.awardForTaskCompletion(task, user, function(err, badges) {
            // this badge array contains NEWLY awarded badges
            assert.equal(badges.length, 0, 'badge should not be created');
            done();
          });
        });
      });
    });

  });

  describe('#awardForTaskPublish()', function() {
    var tags = {
          oneTime: {
            name: 'One time',
            type: 'task-time-required'
          },
          ongoing: {
            name: 'Ongoing',
            type: 'task-time-required'
          }
        };

    describe('first one time task', function(){
      it('should award a badge', function (done) {
        var taskList = [tasks.oneTime];
        Badge.awardForTaskPublish(taskList, user.id, function(err, badges) {
          // this badge array contains NEWLY awarded badges
          assert.equal(badges.length, 1, 'badge should be created');
          done();
        });

      });
    });

    describe('second one time task', function(){
      it('should not award a badge', function (done) {
        var taskList = [tasks.oneTime];
        Badge.awardForTaskPublish(taskList, user.id, function(err, badges) {
          taskList.push(tasks.anotherTime);
          Badge.awardForTaskPublish(taskList, user.id, function(err, badges) {
            assert.equal(badges.length, 0, 'a second badge should not be created');
            done();
          });
        });
      });
    });

    describe('first ongoing task', function(){
      it('should award a badge', function (done) {
        var taskList = [tasks.ongoing];
        Badge.awardForTaskPublish(taskList, user.id, function(err, badges) {
          // this badge array contains NEWLY awarded badges
          assert.equal(badges.length, 1, 'badge should be created');
          done();
        });

      });
    });

    describe('second ongoing task', function(){
      it('should not award a badge', function (done) {
        var taskList = [tasks.ongoing];
        Badge.awardForTaskPublish(taskList, user.id, function(err, badges) {
          taskList.push(tasks.anotherOngoing);
          Badge.awardForTaskPublish(taskList, user.id, function(err, badges) {
            assert.equal(badges.length, 0, 'another badge should not be created');
            done();
          });
        });
      });
    });
  });
});
