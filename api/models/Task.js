/*---------------------
    :: Task
    -> model
---------------------*/
var exportUtils = require('../services/utils/export'),
    moment = require('moment');

module.exports = {

  attributes: {
    // Current state of the task
    state: {
        type: 'STRING',
        defaultsTo: sails.config.taskState || 'open'
    },
    // user id of the task owner
    userId: 'INTEGER',
    // project id of the parent project
    projectId: 'INTEGER',
    // title of the task
    title: 'STRING',
    // description of the task
    description: 'STRING',
    completedBy: 'datetime',

    publishedAt: 'datetime',
    assignedAt: 'datetime',
    completedAt: 'datetime',

    // Tag association
    tags: {
      collection: 'tagEntity',
      via: 'tasks',
      dominant: true
    },

    isOpen: function(){
        if ( _.indexOf(['open','public','assigned'],this.state) != -1 ){
            return true;
        }
        return false;
    },

    isClosed: function(){
        if ( _.indexOf(['closed','archived','completed'],this.state) != -1 ){
            return true;
        }
        return false;
    },
    // Called when a task is marked as complete, and increments
    // each participant's completedTasks counter
    volunteersCompleted: function() {
      var task = this;

      Volunteer.find({ taskId: task.id }).exec(function(err, volunteers){
        if (err) return done(err);

        volunteers.forEach(function(vol) {
          User.findOne({ id: vol.userId }).exec(function(err, user) {
            user.taskCompleted(task);
          });
        });
      });
    }
  },

  exportFormat: {
    'project_id': 'projectId',
    'name': {field: 'title', filter: exportUtils.nullToEmptyString},
    'description': {field: 'description', filter: exportUtils.nullToEmptyString},
    'created_date': {field: 'createdAt', filter: exportUtils.excelDateFormat},
    'published_date': {field: 'publishedAt', filter: exportUtils.excelDateFormat},
    'assigned_date': {field: 'assignedAt', filter: exportUtils.excelDateFormat},
    'creator_name': {field: 'creator_name', filter: exportUtils.nullToEmptyString},
    'signups': 'signups',
    'task_id': 'id',
    'task_state': 'state',
    'agency_name': {field: 'agency_name', filter: exportUtils.nullToEmptyString},
    'completion_date': {field: 'completedAt', filter: exportUtils.excelDateFormat}
  },

  beforeUpdate: function(values, done) {
    Task.findOne({ id: values.id }).exec(function(err, task) {
      if (err) done(err);

      // If task state hasn't changed, continue
      if (task && task.state === values.state) return done();

      // If new task or state has changed, update timestamps
      var action = false;
      switch (values.state) {
        case 'open':
          values.publishedAt = new Date();
          action = 'task.update.opened';
          break;
        case 'assigned':
          values.assignedAt = new Date();
          action = 'task.update.assigned';
          break;
        case 'completed':
          values.completedAt = new Date();
          action = 'task.update.completed';
          task && task.volunteersCompleted();
          break;
      }

      // If no notification specified, continue
      if (!values.id || !action) return done();

      // Set up notification for updates (needs to happen here instead
      // of afterUpdate so we can compare to see if state changed)
      Notification.create({
        action: action,
        model: values
      }, done);

    });
  },
  afterUpdate: function(task, done) {
    var self = this;

    Task.find({ userId: task.userId }).populate('tags').exec(function(err, tasks) {
      if (err) return done(err);
      Badge.awardForTaskPublish(tasks, task.userId);
      done();
    });
  },
  beforeCreate: function(values, done) {
    // If default state is not draft, we need to set dates
    this.beforeUpdate(values, done);
  },

  afterCreate: function(model, done) {
    Notification.create({
      action: 'task.create.thanks',
      model: model
    }, done);
  },

  sendNotifications: function(i) {
    i = i || 0;

    var now = new Date(new Date().toISOString().split('T')[0]),
        begin = moment(now).add(i, 'days').toDate(),
        end = moment(now).add(i+1, 'days').toDate();

    Task.find({
      completedBy: { '>=': begin, '<': end },
      state: 'assigned'
    }).exec(function(err, tasks) {
      if (err) return sails.log.error(err);
      var action = i ? 'task.due.soon' : 'task.due.today';

      tasks.forEach(function(task) {
        var find = { action: action, callerId: task.id },
            model = { action: action, callerId: task.id, model: task };
        Notification.findOrCreate(find, model, function(err, notification) {
          if (err) sails.log.error(err);
          if (notification) sails.log.verbose('New notification', notification);
        });
      });

    });
  }

};
