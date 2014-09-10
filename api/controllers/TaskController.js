/**
 * TaskController
 *
 * @module    :: Controller
 * @description :: Interaction with tasks
 */
var taskUtil = require('../services/utils/task');
var tagUtil = require('../services/utils/tag');
var userUtil = require('../services/utils/user');

module.exports = {

  find: function (req, res) {
    if (req.task) {
      var user = null;
      if (req.user) {
        user = req.user[0];
      }
      taskUtil.getMetadata(req.task, user, function (err) {
        if (err) { return res.send(400, { message: 'Error looking up task likes.' }); }
        taskUtil.getVolunteers(req.task, function (err) {
          if (err) { return res.send(400, { message: 'Error looking up task volunteers.' }); }
          return res.send(req.task);
        });
      });
      return;
    }
    // run the common task find query
    taskUtil.findTasks({}, function (err, tasks) {
      if (err) { return res.send(400, err); }
      return res.send({ tasks: tasks });
    });
  },

  findOne: function(req, res) {
    module.exports.find(req, res);
  },

  findAllByProjectId: function (req, res) {
    Task.findByProjectId(req.params.id)
    .sort({'updatedAt': -1})
    .exec(function(err, tasks) {
      if (err) return res.send(err, 500);
      res.send({ tasks: tasks });
    });
  }

};
