var async = require('async');
var _ = require('underscore');

function Decorator(data) {
  this.data = data;
};

_.extend(Decorator.prototype, {
  addMetrics: function(callback) {
    async.parallel([
      this.addLockedMetrics.bind(this),
      this.addCreatedProjectMetrics.bind(this),
      this.addCreatedTaskMetrics.bind(this),
      this.addVolunteeredTaskMetrics.bind(this)
    ], function(err) { callback(); } );
  },

  addLockedMetrics: function(done) {
    this.data.locked = false;
    var passwordAttemptLimit = sails.config.auth.auth.local.passwordAttempts;
    if (this.data.passwordAttempts >= passwordAttemptLimit) {
      this.data.locked = true;
    }

    done();
  },

  // TODO: this could probably be handled better by an association!
  addCreatedProjectMetrics: function(done) {
    this.data.projectsCreatedOpen = 0;
    this.data.projectsCreatedClosed = 0;

    ProjectOwner.find().where({userId: this.data.id}).exec(
      this.curryHandler(this.findOwnedProjects, 'Owners', done)
    );
  },

  // TODO: seems like this could be done similar to the others with a single query that is then sorted and set
  addCreatedTaskMetrics: function(done) {
    this.data.tasksCreatedOpen = 0;
    this.data.tasksCreatedAssigned = 0;
    this.data.tasksCreatedCompleted = 0;
    this.data.tasksCreatedArchived = 0;

    async.parallel([
      this.countTasksByTypeAndSetMetrics('open', 'tasksCreatedOpen'),
      this.countTasksByTypeAndSetMetrics('assigned', 'tasksCreatedAssigned'),
      this.countTasksByTypeAndSetMetrics('completed', 'tasksCreatedCompleted'),
      this.countTasksByTypeAndSetMetrics('archived', 'tasksCreatedArchived')
    ], function(err) { done(null); });
  },

  addVolunteeredTaskMetrics: function(done) {
    this.data.volCountOpen = 0;
    this.data.volCountAssigned= 0;
    this.data.volCountCompleted = 0;
    this.data.volCountArchived = 0;

    Volunteer.find().where({userId: this.data.id}).exec(
      this.curryHandler(this.findVolunteeredTasks, 'Volunteers', done)
    );
  },

  curryHandler: function(handler, collectionName, done) {
    var handler = handler.bind(this);

    return function(err, collection) {
      if (err) {
        done('Failed to retrieve' + collectionName + ' ' + err);
      } else if (collection.length == 0) {
        done(null);
      } else {
        handler(err, collection, done);
      }
    };
  },

  findOwnedProjects: function(err, owners, done) {
    var projIds = _.pluck(owners, 'projectId');

    Project.find().where({id: projIds}).exec(
      this.curryHandler(this.sortProjectAndAddMetrics, 'Projects', done)
    );
  },

  findVolunteeredTasks: function(err, volunteers, done) {
    taskIds = _.pluck(volunteers, 'taskId');

    Task.find().where({id: taskIds}).exec(
      this.curryHandler(this.sortVolunteeredTasksAndAddMetrics, 'volunteered tasks', done)
    );
  },

  countTasksByTypeAndSetMetrics: function(state, countName) {
    return function(next) {
      Task.countByState(state).where({userId: this.data.id}).exec(function(err, count) {
        this.data[countName] = count;
        next();
      }.bind(this));
    }.bind(this);
  },

  sortProjectAndAddMetrics: function(err, projects, done) {
    var openProjectCount = _.countBy(projects, function(project) {
      return project.state;
    });

    this.data.projectsCreatedOpen = openProjectCount['open'];
    this.data.projectsCreatedClosed = projects.length - openProjectCount['open'];

    done();
  },

  sortVolunteeredTasksAndAddMetrics: function(err, tasks, done) {
    var taskCounts = _.countBy(tasks, function(task) {
      return task.state;
    });

    this.data.volCountOpen = taskCounts['open'];
    this.data.volCountAssigned = taskCounts['assigned'];
    this.data.volCountCompleted = taskCounts['completed'];
    this.data.volCountArchived = taskCounts['archived'];

    done();
  }
});

module.exports = {
  add: function(user, callback) {
    var decorator = new Decorator(user);
    decorator.addMetrics(callback);
  },

  Decorator: Decorator
};
