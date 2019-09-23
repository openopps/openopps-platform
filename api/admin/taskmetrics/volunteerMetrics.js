const _ = require('lodash');
const DateCodeGenerator = require('./dateCodeGenerator');

function VolunteerMetrics (volunteers,tasks, group) {
  this.volunteers = volunteers;
  this.tasks = tasks;
  this.codeGenerator = new DateCodeGenerator(group);
  this.metrics = {};
}

_.extend(VolunteerMetrics.prototype, {
  calculate: function (done) {
    this.done = done;
    this.findVolunteers();
  },

  findVolunteers: function () {
    this.processVolunteers();
  },

  processVolunteers: function () {
    this.groupVolunteers(); 
  },
  groupVolunteers: function () {
    var codeGenerator = this.codeGenerator;
    this.groupedVolunteer = _.groupBy(this.volunteers, function (volunteer) {
      return codeGenerator.create(volunteer.completedAt);
    });

    var volunteerMetrics = _.reduce(this.groupedVolunteer, function (o, vols, fy) {
      o[fy] = vols.length;
      return o;
    }, {});

    this.metrics.volunteers = volunteerMetrics;
    this.done();
  },
});

module.exports = VolunteerMetrics;