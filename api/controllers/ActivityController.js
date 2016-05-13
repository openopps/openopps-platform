module.exports = {
  badges: function(req, res) {
    Task.find({
      state: 'completed',
      sort: 'createdAt DESC',
      limit: 30
    }).exec(function(err, tasks) {
      if (err) return res.negotiate(err);
      var taskIds = _.pluck(tasks, 'id');
      // could also use badge createdAt?
      Badge.find({ task: taskIds }).exec(function(err, badges){
        if (err) return res.negotiate(err);

        Volunteer.find({ task: taskIds }).exec(function(err, vols) {
          if (err) return res.negotiate(err);

          // Ensure that the User model is being queried for both the original
          // task creator and the users that are labeled as volunteers.

          var allUserIds = _.uniq(_.union( _.pluck( tasks, 'owner' ),
                                           _.pluck( vols, 'userId' )));

          User.find( {id: allUserIds} ).exec(function(err, users) {
            if (err) return res.negotiate(err);

            badges.forEach(function(badge){
              badge.description = badge.getDescription();
              badge.user = _.where(users, { id: badge.user })[0];
              // user will be null when user signed up, but was not assigned
            });

            // don't show newcomer badges for tasks where user was removed
            badges = _.reject(badges, function(b) { return b.user == null } );

            tasks = tasks.map(function(task) {

              var ids = _(vols).chain()
                    .where({ task: task.id })
                    .pluck('userId').value();

              task.badges = _.where(badges, { task: task.id });
              task.participants = _.filter(users, function(user) {
                return _.contains(ids, user.id);
              });

              return task;
            });

            res.json(tasks);

          });
        });
      });
    });
  },

  users: function(req, res) {
    // TODO: include new tasks and volunteer events for
    // "agency posted a task" or "participant signed up"
    var events = [];
    Notification.find({
      action: 'user.create.welcome',
      sort: 'createdAt DESC',
      limit: 10
    }).exec(function(err, events) {
      if (err) return res.negotiate(err);
      User.find({
        id: _(events).pluck('model').compact().pluck('id').value(),
        sort: 'createdAt DESC'
      }).exec(function(err, users) {
        if (err) return res.negotiate(err);
        return res.send(users);
      });
    });
  },

  count: function(req, res) {
    var where = req.param('where', {});
    Task.count(where).exec(function(err, count) {
      if (err) return res.negotiate(err);
      res.json(count);
    });
  },
};
