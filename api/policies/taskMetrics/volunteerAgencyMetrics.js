var _ = require('underscore');
var DateCodeGenerator = require(__dirname + "/dateCodeGenerator");

function VolunteerAgencyMetrics(tasks, group) {
  this.tasks = tasks;
  this.codeGenerator = new DateCodeGenerator(group);
  this.metrics = {};
}

_.extend(VolunteerAgencyMetrics.prototype, {
  calculate: function(done) {
    this.done = done;
    this.findVolunteers();
  },

  findVolunteers: function() {
    var ids = _.pluck(this.tasks, 'id');
    Volunteer.find({ taskId: ids }).exec(function(err, volunteers) {
      if (err) return done('volunteer');
      this.volunteers = volunteers;
      this.processVolunteers();
    }.bind(this));
  },

  processVolunteers: function() {
    this.groupVolunteers();
    this.findAgencyPeople();
  },

  groupVolunteers: function() {
    var codeGenerator = this.codeGenerator;
    this.groupedVolunteer = _.groupBy(this.volunteers, function(volunteer) {
      return codeGenerator.create(volunteer.createdAt);
    });

    var volunteerMetrics = _.reduce(this.groupedVolunteer, function(o, vols, fy) {
      o[fy] = vols.length;
      return o;
    }, {});

    this.metrics.volunteers = volunteerMetrics;
  },

  findAgencyPeople: function() {
    var volunteerIds = _.pluck(this.volunteers, 'userId');

    User.find({ id: volunteerIds }).populate('tags', { type: 'agency' }).exec(function(err, users) {
      if (err) return this.done('volunteer');
      this.handleAgencyTaggedUsers(users);
    }.bind(this));
  },

  handleAgencyTaggedUsers: function(users) {
    var agencyMetrics = _.reduce(this.groupedVolunteer, function(o, vols, fy) {
      // Return agency (first tag) for matching user
      o[fy] = _.chain(vols).map(function(vol) {
        var volUser = _.findWhere(users, { id: vol.userId });
        if (!volUser || !volUser.tags || !volUser.tags[0]) return undefined;
        return (volUser.tags[0] || {}).id;
      }).compact().uniq().value().length;

      return o;
    }, {});

    this.metrics.agencies = agencyMetrics;
    this.done();
  }
});

module.exports = VolunteerAgencyMetrics;
