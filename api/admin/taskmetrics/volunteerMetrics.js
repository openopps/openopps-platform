const _ = require('lodash');
const DateCodeGenerator = require('./dateCodeGenerator');

function VolunteerMetrics (volunteers,filter,tasks, group) {
  this.volunteers = volunteers;
  this.tasks = tasks;
  this.filter=filter;
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
    this.volunteers=  this.filterVolunteers(this.volunteers);
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

  filterVolunteers: function (tasks) {
    if (this.filter) {
      var filter = this.filter;
      if(filter == 'Part-time' || filter == 'Full-time'){
        tasks= _.filter(tasks,function (task){
          return task.detailSelection == filter;
        });
      }  
      else{
        tasks = _.filter(tasks, function (task) {
          return task.tagname=== filter;
        });
      }
    }
    return tasks;
  },
});

module.exports = VolunteerMetrics;