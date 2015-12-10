var async = require('async');
var assert = require('chai').assert;
var _ = require('underscore');

var conf = require('../../../api/sails/helpers/config');

var userMetrics = require('../../../../api/services/utils/userMetrics');

describe('userMetrics.Decorator(user)', function() {
  var user, Decorator, decorator;

  beforeEach(function(done){
    Decorator = userMetrics.Decorator;

    function createUser() {
      User.create(conf.defaultUser).exec(function(err, newUser) {
        user = newUser;
        decorator = new Decorator(user);
        done(err);
      });
    }

    // Delete all the users with each test run, otherwise CRASH!
    User.find().exec(function(err, users) {
      async.each(users, function(foundUser, next) {
        foundUser.destroy(next);
      }, createUser);
    });
  });

  describe('#addLockedMetrics(callback)', function() {
    describe('when password attempts not yet exceeded', function() {
      it('sets the user locked attribute to false', function(done) {
        decorator.addLockedMetrics(function(err) {
          assert.equal(user.locked, false);
          done();
        });
      });
    });

    describe('when password attempts not yet exceeded', function() {
      it('sets the user locked attribute to true', function(done) {
        user.passwordAttempts = 100;

        decorator.addLockedMetrics(function() {
          assert.equal(user.locked, true);
          done();
        });
      });
    });
  });

  describe('#addCreatedProjectMetrics(callback)', function() {
    describe('when there are no created projects', function() {
      it('sets the related counts to 0', function(done) {
        decorator.addCreatedProjectMetrics(function() {
          assert.equal(user.projectsCreatedOpen, 0);
          assert.equal(user.projectsCreatedClosed, 0);
          done();
        });
      });
    });

    describe('when both open and closed projects have been created', function() {
      beforeEach(function(done) {
        var projects = [];

        function createAssociations() {
          async.each(projects, function(project, next) {
            ProjectOwner.create({userId: user.id, projectId: project.id}, next);
          }, done);
        }

        projectData = [
          conf.project, // open project by default
          {state: 'completed', title: 'not-open'},
          {state: 'archived', title: 'in-flux'}
        ];

        async.each(projectData, function(project, next) {
          Project.create(project).exec(function(err, newProject) {
            projects.push(newProject);
            next();
          });
        }, createAssociations);
      });

      it('sets those attributes to the right numbers', function(done) {
        decorator.addCreatedProjectMetrics(function() {
          assert.equal(user.projectsCreatedOpen, 1);
          assert.equal(user.projectsCreatedClosed, 2);

          done();
        });
      });
    });
  });

  describe('#addCreatedTaskMetrics', function() {
    describe('when there are no tasks created by the user', function() {
      it('should have zero values for everything', function(done) {
        decorator.addCreatedTaskMetrics(function() {
          assert.equal(user.tasksCreatedOpen, 0);
          assert.equal(user.tasksCreatedAssigned, 0);
          assert.equal(user.tasksCreatedCompleted, 0);
          assert.equal(user.tasksCreatedArchived, 0);

          done();
        });
      });
    });

    describe('when there are various tasks created by the user', function() {
      var expectedCounts;

      beforeEach(function(done) {
        expectedCounts = {};

        async.each(['open', 'assigned', 'completed', 'archived'], function(state, next) {
          var numberOfTimes = Math.floor(Math.random() * 10) + 1;
          expectedCounts[state] = numberOfTimes;

          async.times(numberOfTimes, function(n, nextNext) {
            Task.create({
              userId: user.id,
              state: state
            }).exec(nextNext);
          }, next);
        }, done);
      });

      it('returns the correct stats', function(done) {
        decorator.addCreatedTaskMetrics(function() {
          assert.equal(user.tasksCreatedOpen,       expectedCounts['open']);
          assert.equal(user.tasksCreatedAssigned,   expectedCounts['assigned']);
          assert.equal(user.tasksCreatedCompleted,  expectedCounts['completed']);
          assert.equal(user.tasksCreatedArchived,   expectedCounts['archived']);

          done();
        });
      });
    });
  });

  describe('#addVolunteeredTaskMetrics(callback)', function() {
    describe('when the user has not volunteered', function() {
      it('should have zero values for everything', function(done) {
        decorator.addVolunteeredTaskMetrics(function() {
          assert.equal(user.volCountOpen, 0);
          assert.equal(user.volCountAssigned, 0);
          assert.equal(user.volCountCompleted, 0);
          assert.equal(user.volCountArchived, 0);

          done();
        });
      });
    });

    describe('when the user has volunteered for several tasks', function() {
      var expectedCounts;

      beforeEach(function(done) {
        expectedCounts = {};
        tasks = [];

        var createVolunteers = function(err) {
          async.each(tasks, function(task, next) {
            Volunteer.create({userId: user.id, taskId: task.id}).exec(next);
          }, done);
        };

        async.each(['open', 'assigned', 'completed', 'archived'], function(state, next) {
          var numberOfTimes = Math.floor(Math.random() * 10) + 1;
          expectedCounts[state] = numberOfTimes;

          async.times(numberOfTimes, function(n, nextNext) {
            Task.create({
              userId: user.id,
              state: state
            }).exec(function(err, task) {
              tasks.push(task);
              nextNext();
            });
          }, next);
        }, createVolunteers);
      });

      it('returns the correct stats', function(done) {
        decorator.addVolunteeredTaskMetrics(function() {
          assert.equal(user.volCountOpen, expectedCounts['open']);
          assert.equal(user.volCountAssigned, expectedCounts['assigned']);
          assert.equal(user.volCountCompleted, expectedCounts['completed']);
          assert.equal(user.volCountArchived, expectedCounts['archived']);

          done();
        });
      });
    });
  });
 });
