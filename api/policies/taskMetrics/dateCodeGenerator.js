var _ = require('underscore');
var DateDecorator = require(__dirname + "/dateDecorator");

function DateCodeGenerator(group) {
  this.group = group;
}

_.extend(DateCodeGenerator.prototype, {
  method: function() {
    return this.methodMap[this.group] || "fiscalYear";
  },

  methodMap: {
    'week': 'calendarYearWeek',
    'month': 'calendarYearMonth',
    'quarter': 'calendarYearQuarter',
    'fyquarter': 'fiscalYearQuarter',
    'year': 'calendarYear'
  },

  create: function(input) {
    var decorator = new DateDecorator(input);
    return decorator[this.method()]();
  }
});

module.exports = DateCodeGenerator;
