/**
 * Get the task referenced in projectId of the request body
 * and check if access is allowed
 */
module.exports = function authorizeTask(req, res, next) {
  sails.log.verbose("authorizeTask", req.params)

  if (req.params['id']) {
    Task.authorized(req.params.id, req.user, function(err, task) {
      if (err) return res.send({ message: err });
      if (!task) return res.send(403, { message: 'Not authorized.' });
      req.task = task;
      req.taskId = task.id;
      req.isOwner = task.isOwner;
      sails.log.verbose("authorized:", task)
      next();
    });
    // no :id is specified, so continue
  } else {
    next();
  }
};
