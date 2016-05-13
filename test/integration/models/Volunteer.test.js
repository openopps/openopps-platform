var assert = require('chai').assert;
var users = require('../../fixtures/user');
var sinon = require('sinon');
var Promise = require('bluebird');

// Reusable utilities

function createUsers(numUsers) {
  var promises = [];

  for (var i = 0; i < numUsers; i++) {
    promises.push(User.create(
      {
        'name': i.toString(),
        'username': i.toString() + '@gmail.com',
        'password': 'TestTest123#'
      }
    ));
  }

  return Promise.all(promises);
}

function createVolunteers(users, task) {
  var promises = [];
  var resolver = Promise.defer();
  Promise.each(users, function(user, index, length) {
    var promise = Volunteer.createAction({user: users[index].id, taskId: task});

    promises.push(promise);

    return promise;
  }).then(function(result) {
    resolver.resolve(promises);
  });

  return resolver.promise;
}

describe('Volunteer model', function() {
  var ownerUser;
  var task;

  beforeEach(function(done) {
    User.create(users.emmy).then(function(emmyUser) {
      ownerUser = emmyUser;

      Task.create({userId: ownerUser.id}).then(function(newTask) {
        task = newTask;

        done();
      });
    });
  });

  describe('a new Volunteer', function() {
    it('should be created', function(done) {
      createUsers(1).then(function(users) {
        var user = users[0];

        Volunteer.createAction({userId: user.id, taskId: task.id}).then(function(volunteer) {
          assert.equal(volunteer.userId, user.id);
          assert.equal(volunteer.task, task.id);

          done();
        });
      });
    });
  });

  describe('a team builder badge', function () {
    it('should be given to the task creator when 4 volunteers are created for the task', function(done) {
      createUsers(4).then(function(users) {
        createVolunteers(users, task.id).then(function(volunteers) {
          Badge.find({}).then(function(badges) {
            assert.equal(badges.length, 1);
            assert.equal(badges[0].user, ownerUser.id);
            assert.equal(badges[0].task, task.id);
            assert.equal(badges[0].type, 'team builder');

            done();
          });
        });
      });
    });

    it('should be not be given to the task creator when 3 volunteers are created for the task', function(done) {
      createUsers(3).then(function(users) {
        createVolunteers(users, task.id).then(function(volunteers) {
          Badge.find({}).then(function(badges) {
            assert.equal(badges.length, 0);

            done();
          });
        });
      });
    });

    it('should not be given more than once to the task creator when 5 volunteers are created for the task', function(done) {
      createUsers(5).then(function(users) {
        createVolunteers(users, task.id).then(function(volunteers) {
          Badge.find({}).then(function(badges) {
            assert.equal(badges.length, 1);

            done();
          });
        });
      });
    });

    it('should only be given once to a task creator when multiple tasks have 4 volunteers', function(done) {
      Task.create({userId: ownerUser.id}).then(function(secondTask) {
        createUsers(4).then(function(users) {
          createVolunteers(users, task.id).then(function(volunteers) {
            createVolunteers(users, secondTask.id).then(function(volunteers) {
              Badge.find({}).then(function(badges) {
                assert.equal(badges.length, 1);

                done();
              });
            });
          });
        });
      });
    });
  });
});
