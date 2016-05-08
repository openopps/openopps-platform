/**
 * Volunteer
 *
 * @module      :: Model
 * @description :: Stores volunteer information for tasks
 *
 */
module.exports = {

  attributes: {

    // the user that is volunteering
    userId: 'INTEGER',
    // send notification or not, after create
    silent: 'BOOLEAN',

    // The task which a user volunteers for
    task: {
      model: 'task',
      columnName: 'taskId'
    }

  },

  // create notification after creating a volunteer
  afterCreate: function ( model, done ) {

    this.assignVolunteerCountBadges( model , function(err) {
      if (err) return done(err);

      if ( true === model.silent ) { return done(); }

      Notification.create( {
        action: 'volunteer.create.thanks',
        model: model,
      }, done );
    });
  },

  afterDestroy: function(model, done) {
    Notification.create({
      action: 'volunteer.destroy.decline',
      // Sails returns an array of deleted models,
      // but we're only deleting them one at a time
      model: model[0]
    }, done);
  },

  assignVolunteerCountBadges: function (model, done) {

    Volunteer.find({ taskId: model.task }).exec(function(err, vols) {
      if (err) return done(err);

      if (vols.length === 4) {
        Task.findOne({ id: model.task }).exec(function(err, task) {
          if (err) return done(err);

          var badge = {
            user: task.owner,
            type: 'team builder',
            task: model.task
          };

          Badge.findOrCreate(badge, badge).exec(function(err, b){
            // swallow a potential error (expected) that the badge already exists.
            if (err && err._e.toString().match('Badge already exists')) {
              err = null;
            }

            if (err) return done(err);
            done();
          });
        });
      } else {
        done();
      }
    });

  }
};
