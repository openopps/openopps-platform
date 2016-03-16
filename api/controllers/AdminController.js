var json2csv = require('json2csv');

/**
 * AdminController
 *
 * @module      :: Controller
 * @description	:: Administrative functions only available to admin users
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var async = require('async');

var addUserMetrics = require(__dirname + '/../services/utils/userMetrics').add;
var TaskMetrics = require(__dirname + '/../services/utils/taskMetrics');

module.exports = {

  /**
   * List users that match a certain filter, or all users if no filter
   * @param page the current page number
   * @param limit the maximum number of results per page to return
   * @param q the filter to apply to the search (filters by name)
   */
  users: function (req, res) {
    var page = parseInt(req.param('page', 1));
    var limit = req.param('limit', 25);
    var query = req.param('q');
    var where = {};

    if (query) {
      // search by both name and username
      where = {
        or: [
          { like: { name: '%' + query + '%' }},
          { like: { username: '%' + query + '%' }}
        ]
      };
    }

    // find users that meet this criteria
    User.find()
      .where(where)
      .sort({ createdAt: 'desc' })
      .paginate({ page: page, limit: limit})
      .exec(function (err, users) {
        if (err) { return res.send(400, { message: 'Error looking up users', err: err}); }
        // count the total number of users
        User.count(function (err, count) {
          if (err) { return res.send(400, { message: 'Error counting users', err: err}); }
          async.each(users, addUserMetrics, function(err) {
            if (err) { res.send(400, { message: 'Error retrieving metrics for users.', err: err}); }
            // return a paginated object
            return res.send({
              page: page,
              limit: Math.min(users.length, limit),
              count: count,
              users: users,
              q: query
            });
          });
        });
      });
  },

  /**
   * Retrieve metrics not tied to a particular user
   * eg: /api/admin/metrics
   */
  metrics: function ( req, res ) {

    var metrics = {

      users: {
        count: 0,
        withTasks: 0,
      },

      tasks: {
        count: 0,
        submitted: 0,
        draft: 0,
        open: 0,
        assigned: 0,
        completed: 0,
        archived: 0,
      },

      projects: {
        count: 0,
      },

    };

    User.count( { disabled: false } )
      .exec( function ( err, userCount ) {

        if ( err ) {
          return res.send(
            400,
            {
              message: 'An error occurred looking up user metrics.',
              error: err,
            }
          );
        }

        metrics.users.count = userCount;

        Task.find()
          .sort( 'userId' )
          .exec( function (err, tasks) {

            if (err) {
              return res.send(
                400,
                {
                  message: 'An error occurred looking up task metrics.',
                  error: err,
                }
              );
            }

            metrics.users.withTasks = _( tasks ).pluck( 'userId' ).uniq().value().length;
            metrics.tasks.count = tasks.length;

            var taskState = '';
            _( tasks ).each( function ( task ) {

              taskState = _.property( 'state' )( task );

              if ( _.isNumber( metrics.tasks[ taskState ] ) ) {
                metrics.tasks[ taskState ] += 1;
              }

            } );

            Volunteer.find().sort( 'taskId' ).exec( function ( err, vols ) {

              if ( err ) {
                return res.send(
                  400,
                  {
                    message: 'An error occurred looking up task metrics.',
                    error: err,
                  }
                );
              }

              var lastId = -1;
              for ( var j = 0; j < vols.length; j++ ) {
                if ( vols[j].taskId !== lastId ) {
                  metrics.tasks.withVolunteers++;
                  lastId = vols[j].taskId;
                }
              }

              Project.count().exec( function ( err, projectCount ) {
                if ( err ) {
                  return res.send(
                    400,
                    {
                      message: 'An error occurred looking up project metrics.',
                      error: err,
                    }
                  );
                }

                metrics.projects.count = projectCount;
                return res.send(metrics);

              } );

            } );

          } );

      } );

  },

  /**
   * Task metrics API
   * Provides data for the task metrics section of the admin
   * dashboard. At some point, it may be consolidated
   * with the above endpoint.
   */
  taskMetrics: function(req, res) {
    var generator = new TaskMetrics(req.param);
    generator.generateMetrics(function(err) {
      if (err) res.serverError(err + ' metrics are unavailable.');
      res.send(generator.metrics);
    });
  },


  /**
   * Add or remove admin privileges from a user account
   * @param id the user id to make an admin or remove
   * @param action true to make admin, false to revoke
   * eg: /api/admin/admin/:id?action=true
   */
  admin: function (req, res) {
    if (!req.route.params.id) {
      return res.send(400, { message: 'Must specify a user id for this action.' });
    }
    User.findOneById(req.route.params.id, function (err, user) {
      if (err) { return res.send(400, { message: 'An error occurred looking up this user.', error: err }); }
      user.isAdmin = (req.param('action') === 'true');
      user.save(function (err) {
        if (err) { return res.send(400, { message: 'An error occurred changing admin status for this user.', error: err }); }
        return res.send(user);
      });
    });
  },

  /**
   * Add or remove agency admin privileges from a user account
   * @param id the user id to make an agency admin or remove
   * @param action true to make agency admin, false to revoke
   * eg: /api/admin/agencyAdmin/:id?action=true
   */
  agencyAdmin: function (req, res) {
    if (!req.route.params.id) {
      return res.send(400, { message: 'Must specify a user id for this action.' });
    }
    User.findOneById(req.route.params.id, function (err, user) {
      if (err) { return res.send(400, { message: 'An error occurred looking up this user.', error: err }); }
      user.isAgencyAdmin = (req.param('action') === 'true');
      user.save(function (err) {
        if (err) { return res.send(400, { message: 'An error occurred changing admin status for this user.', error: err }); }
        return res.send(user);
      });
    });
  },


  /**
   * Unlock a user's account by resetting their password attempts
   * @param id the user id to clear password attempts
   */
  unlock: function (req, res) {
    if (!req.route.params.id) {
      return res.send(400, { message: 'Must specify a user id for this action.' });
    }
    User.findOneById(req.route.params.id, function (err, user) {
      if (err) { return res.send(400, { message: 'An error occurred looking up this user.', error: err }); }
      user.passwordAttempts = 0;
      user.save(function (err) {
        if (err) { return res.send(400, { message: 'An error occurred resetting password attempts.', error: err }); }
        return res.send(user);
      });
    });
  },

  /**
  * List recent notifications for activity feed
  * eg: /api/admin/activities
  */
  activities: function (req, res) {
    // Query parameters
    var page = parseInt(req.param('page', 1)),
        limit = req.param('limit', 50),
        sort = req.param('sort', 'createdAt desc');

    // Set up templates to for what data needs to be returned
    var templates = {

      newComment: function(event, done) {
        var activity = {
              type: 'newComment',
              createdAt: event.createdAt,
              comment: {},
              userId: null
            },
            steps = [];

        // Get comment model
        steps.push(function(done) {
          var id = (event.model || {}).id;
          Comment.findOne({ id: id }).exec(function(err, result) {
            if (err) return done('Failed to find model' + err);
            activity.comment = result || {};
            activity.comment.value = activity.comment.value || "";
            done();
          });
        });

        // Get comment user
        steps.push(function(done) {
          var comment = activity.comment;
          User.findOne({ id: comment.userId }).exec(function(err, result) {
            if (err) return done('Failed to find model' + err);
            activity.user = result || {};
            done();
          });
        });

        // Get comment task / project
        steps.push(function(done) {

          var comment = activity.comment,
              type = (comment.projectId || null ) ? 'project' : 'task',
              typeId = comment.projectId || comment.taskId || null;

          sails.models[type].findOne({ id: typeId }).exec(function(err, result) {
            if (err) return done('Failed to find model' + err);
            activity.itemType = type;
            activity.item = result || {};
            done();
          });
        });

        async.series(steps, function(err) {
          if (!activity.comment || activity.comment.value === "") {
            activity.comment = {};
          }
          done(err, activity);
        });

      },

      newVolunteer: function (event, done) {
        var activity = {
          type: 'newVolunteer',
          createdAt: event.createdAt
        },
        steps = [];

        // Get task model
        steps.push(function(done) {
          var id = (event.model || {}).taskId;
          Task.findOne({ id: id }).exec(function(err, result) {
            if (err) return done('Failed to find model' + err);
            activity.task = result;
            done();
          });
        });

        // Get user model
        steps.push(function(done) {
          var id = (event.model || {}).userId;
          User.findOne({ id: id }).exec(function(err, user) {
            if (err) return done('Failed to find model' + err);
            activity.user = user;
            done();
          });
        });

        async.series(steps, function(err) {
          done(err, activity);
        });
      },

      newUser: function(event, done) {
        var activity = {
          type: 'newUser',
          createdAt: event.createdAt
        },
        steps = [];

        // Get user model
        steps.push(function(done) {
          var id = (event.model || {}).id;
          User.findOne({ id: id }).exec(function(err, user) {
            if (err) return done('Failed to find model' + err);
            activity.user = user;
            done();
          });
        });

        async.series(steps, function(err) { done(err, activity); });
      },

      newTask: function(event, done) {
        var activity = {
          type: 'newTask',
          createdAt: event.createdAt
        },
        steps = [];

        // Get task model
        steps.push(function(done) {
          var id = (event.model || {}).id;
          Task.findOne({ id: id }).exec(function(err, task) {
            if (err) return done('Failed to find model' + err);
            activity.task = task;
            done();
          });
        });

        // Get user model
        steps.push(function(done) {
          if (!activity.task) return done();
          User.findOne({ id: activity.task.userId }).exec(function(err, user) {
            if (err) return done('Failed to find model' + err);
            activity.user = user;
            done();
          });
        });

        async.series(steps, function(err) { done(err, activity); });
      }

    };

    // Map actions to templates
    var actions = {
      'comment.create.owner': templates.newComment,
      'volunteer.create.thanks': templates.newVolunteer,
      'user.create.welcome': templates.newUser,
      'task.create.thanks': templates.newTask
    };

    // Get active notifications
    Notification.find({})
      .sort(sort)
      .paginate({ page: page, limit: limit})
      .exec(next);

    // Process notifications
    function next(err, notifications) {
      if (err) return res.send(400, {
        message: 'An error occurred looking up recent activities.',
        error: err
      });

      var activities = [];

      // Apply templates
      async.map(notifications, function(notification, done) {
        if (actions[notification.action]) {
          actions[notification.action](notification, done);
        } else {
          done();
        }
      }, function(err, results) {
        if (err) return res.send(400, {
          message: 'An error occurred looking up recent activities.',
          error: err
        });

        // Remove falsy items
        results = _.compact(results);

        // Return templates
        res.send(results);
      });

    }

  },

  /**
  * List tasks
  * eg: /api/admin/tasks
  */
  tasks: function ( req, res ) {

    var page = parseInt( req.param( 'page', 1 ) ),
      limit = req.param( 'limit', 1000 ),
      sort = req.param( 'sort', 'createdAt desc' ),
      output = {
        open: 0,
        withSignups: 0,
        assigned: 0,
        completed: 0,
      },
      openTasks,
      steps = [];

    // Get tasks
    //
    steps.push( function ( done ) {
      Task.find( { state: [ 'draft', 'submitted', 'open', 'public', 'assigned', 'completed' ] } )
        .sort( sort )
        .paginate( { page: page, limit: limit } )
        .exec( function ( err, tasks ) {
          if ( err ) { return done( err ); }
          openTasks = _.where( tasks, function ( task ) { return task.isOpen(); } );
          User.find( { id: _.pluck(tasks, 'userId') } ).exec(function ( err, users ) {
            if ( err ) { return done( err ); }

            tasks.forEach( function ( task, i ) {
              tasks[ i ].user = _.findWhere( users, { id: task.userId } );
            } );
            done( null, tasks );
          });
        } );
    } );

    // Get volunteers
    //
    steps.push( function (done) {

      Volunteer
        .find( { taskId: _.pluck( openTasks, 'id' ) } )
        .exec( function ( err, result ) {
          if ( err ) { return done( err ); }

          var userIds = _.pluck( result, 'userId' );
          User.find( { id: userIds } ).exec(function ( err, users ) {
            if (err) { return done( err ); }

            result.forEach( function ( volunteer, i ) {
              result[ i ].user = _.findWhere( users, { id: volunteer.userId } );
            } );
            done( null, result );

          });

        } );

    } );

    // Build API response
    //
    async.series( steps, function ( err, results ) {
      if ( err ) { return res.send( 400, { message: 'Error looking up tasks', err: err} ); }

      var tasks = results[ 0 ],
        volunteers = results[ 1 ];

      // Populate volunteers for each task
      //
      tasks.forEach( function ( task, i ) {
        tasks[ i ].volunteers = _.where( volunteers, { taskId: task.id } );
      } );

      // Set output properties
      //
      output.drafts = _.where( tasks, function (task) { return task.state === 'draft'; } );
      output.submitted = _.where( tasks, function (task) { return task.state === 'submitted'; } );
      output.assigned = _.where( tasks, function ( task ) { return task.state === 'assigned'; } );
      output.completed = _.where( tasks, function ( task ) { return task.state === 'completed'; } );
      output.withSignups = _.where( tasks, function ( task ) {
        return _( volunteers ).pluck( 'taskId' ).uniq().value().indexOf( task.id ) >= 0;
      } );

      // Output the remaining open tasks
      //
      output.open = _.where( tasks, function ( task ) { return task.state === 'open'; } );

      res.json( output );

    } );

  },

  /**
  * List participants
  * eg: /api/admin/tasks
  */
  participants: function (req, res) {
    var vols, users, tasks;

    async.waterfall([
      function(cb) { Volunteer.find({}).exec(cb); },
      function(newVols, cb) {
        vols = newVols;
        Task.find({ id: _.pluck(vols, 'taskId')}).populate('tags').exec(cb);
      },
      function(newTasks, cb) {
        var ids;
        tasks = newTasks;
        ids = _.pluck(vols, 'userId').concat(_.pluck(tasks, 'userId'));
        User.find({ id: ids }).populate('tags').exec(cb);
      }
    ], function(err, newUsers) {
      if (err) return res.serverError(err);
      users = newUsers;
      vols.map(function(vol) {
        vol.user = _.findWhere(users, { id: vol.userId });
        vol.task = _.findWhere(tasks, { id: vol.taskId });
        if (!vol.task || !vol.user) return false;
        vol.task.user = _.findWhere(users, { id: vol.task.userId });
      });
      vols = _(vols).compact().map(function(d) {
        if (!d.task || !d.user) return false;
        return {
          'Participant': d.user.name || '',
          'Participant Agency': (_.findWhere(d.user.tags, {
            type: 'agency'
          }) || {}).name || '',
          'Task Title': d.task.title || '',
          'Task Categories': _(d.task.tags).chain().filter(function(tag) {
            return tag.type === 'skill' || tag.type === 'topic';
          }).pluck('name').value().join(', ') || '',
          'Task Type': (_.findWhere(d.task.tags, {
            type: 'task-time-required'
          }) || {}).name || '',
          'Task Status': d.task.state || '',
          'Task Location': (_.findWhere(d.task.tags, {
            type: 'location'
          }) || {}).name || '',
          'Task Creator': d.task.user.name || '',
          'Task Creator Agency': (_.findWhere(d.task.user.tags, {
            type: 'agency'
          }) || {}).name || '',
          'Task Date Published': d.task.publishedAt &&
            new Date(d.task.publishedAt).toLocaleDateString() || '',
          'Task Date Completed': d.task.completedAt &&
            new Date(d.task.completedAt).toLocaleDateString() || '',
          'Task Date Closes': d.task.completedBy &&
            new Date(d.task.completedBy).toLocaleDateString() || ''
        };
      }).compact().value();
      if (req.param('export')) {
        json2csv({
          data: vols,
          fields: _.keys(vols[0])
        }, function (err, csv) {
          if (err) return res.serverError(err);
          res.set('Content-Type', 'text/csv');
          res.set('Content-disposition', 'attachment; filename=participants.csv');
          res.send(200, csv);
        });

      } else {
        res.json(vols);
      }
    });
  },

  /**
  * Measure key interactions: http://git.io/AOkF
  * eg: /api/admin/interactions
  */
  interactions: function ( req, res ) {
    /**
    * The interaction metric is the total of the following actions:
    * + someone signs up for an opportunity
    * + task creator assigns the opportunity
    * + posting to the discussion
    * + marking a task completed
    * + someone creates an opportunity in draft
    * + an opportunity is published
    */
    var interactions = {
        submitted: 0,
        signups: 0,
        assignments: 0,
        posts: 0,
        completions: 0,
        drafts: 0,
        publishes: 0,
      },
      page = parseInt( req.param( 'page', 1 ) ),
      limit = req.param( 'limit', 1000 ),
      sort = req.param( 'sort', 'createdAt desc' ),
      steps = [];

    steps.push( function ( done ) {

      Task.find( {} ).sort( sort ).paginate( {

        page: page,
        limit: limit,

      } ).exec( function ( err, tasks ) {

        if ( err ) { return done( err ); }

        interactions.assignments = tasks.reduce( function ( count, task ) {
          return ( task.assignedAt ) ? count + 1 : count;
        }, 0 );

        interactions.completions = tasks.reduce( function ( count, task ) {
          return ( task.completedAt ) ? count + 1 : count;
        }, 0 );

        interactions.drafts = tasks.reduce( function ( count, task ) {
          return ( task.createdAt ) ? count + 1 : count;
        }, 0 );

        interactions.publishes = tasks.reduce( function ( count, task ) {
          return ( task.publishedAt ) ? count + 1 : count;
        }, 0 );

        interactions.submitted = tasks.reduce( function ( count, task ) {
          return ( task.submittedAt ) ? count + 1 : count;
        }, 0 );

        done();

      } );

    } );

    steps.push(function ( done ) {

      Comment.count( {} ).exec( function ( err, count ) {

        if ( err ) { return done( err ); }
        interactions.posts = count;
        done();

      } );

    });

    steps.push( function ( done ) {

      Volunteer.count( {} ).exec( function ( err, count ) {

        if ( err ) { return done( err ); }
        interactions.signups = count;
        done();

      } );

    } );

    async.parallel( steps, function ( err ) {

      if ( err ) {
        return res.send( 400, {
          message: 'Error generating interactions.',
          err: err,
        } );
      }

      res.send( interactions );

    } );

  },

  // Get an agency
  agency: function (req, res) {
    var requestedAgencyId = req.route.params.id;
    // Future work: Figure out requirements
    res.send({ requestedAgency: requestedAgencyId });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AdminController)
   */
  _config: {},

};
