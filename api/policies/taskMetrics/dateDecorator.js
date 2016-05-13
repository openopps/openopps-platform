var _ = require('underscore');

function DateDecorator(input) {
  this.delegate = input ? new Decorator(input) : new NullDecorator();
}

function NullDecorator() {}

function Decorator(input) {
  this.date = new Date(input);
  this.fiscalDate = new Date(input);
  this.fiscalDate.setMonth(this.date.getMonth() + 3);
}

var methods = ['fiscalYear', 'calendarYear', 'calendarYearMonth', 'calendarYearWeek', 'calendarYearQuarter', 'fiscalYearQuarter'];

_.each(methods, function(method) {
  DateDecorator.prototype[method] = function() {
    return this.delegate[method]();
  }

  NullDecorator.prototype[method] = _.noop;
});

_.extend(Decorator.prototype, {
  fiscalYear: function() {
    return this.fiscalDate.getFullYear();
  },

  calendarYear: function() {
    return this.date.getFullYear();
  },

  calendarYearMonth: function() {
    return +this.date.getFullYear() + this.pad((this.date.getMonth() + 1));
  },

  calendarYearWeek: function() {
    return +this.date.getFullYear() + this.pad(this.weekNumber());
  },

  calendarYearQuarter: function() {
    return +this.date.getFullYear() + this.quarter(this.date.getMonth() + 1);
  },

  fiscalYearQuarter: function() {
    return +this.fiscalYear() + this.quarter(this.fiscalDate.getMonth() + 1);
  },

  // private-ish
  weekNumber: function() {
    this.date.setHours(0,0,0);
    this.date.setDate(this.date.getDate()+4-(this.date.getDay()||7));
    return Math.ceil((((this.date-new Date(this.date.getFullYear(),0,1))/8.64e7)+1)/7);
  },

  quarter: function(month) {
    var quarter;
    if      (month <= 3) { quarter = '1'; }
    else if (month <= 6) { quarter = '2'; }
    else if (month <= 9) { quarter = '3'; }
    else                 { quarter = '4'; }
    return quarter;
  },

  pad: function(num) {
    size = 2;
    var s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }
});


module.exports = DateDecorator;
