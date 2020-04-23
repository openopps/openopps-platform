const schedule = require('node-schedule');
const log = require('log')('app:scheduler');
const taskService = ('../api/opportunities/service');

const tasks = {
  TaskDueNotifications: {
    schedule: { hour: 4, minute: 0 }, // 4AM every day
    action: sendTaskDueNotification,
  },
};

function init () {
  tasks.forEach(task => {
    schedule.scheduleJob(task.schedule, task.action);
  });
}

function sendTaskDueNotification () {
  try {
    taskService.sendTasksDueNotifications('task.due.today', 0);
    taskService.sendTasksDueNotifications('task.due.soon', 7);
  } catch (err) {
    log.info('Task due notification failure: ', err);
  }
}

module.exports = {
  init: init,
};
