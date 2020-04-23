var pulls = require('./pulls.json');
var _ = require('underscore');
var fs = require('fs');
var template = fs.readFileSync('./template.md').toString();

var out;

// Filter by date range
out = _.filter(pulls, function(pull) {
  return new Date(pull.created_at) >= new Date('2015-07-01') &&
         new Date(pull.created_at) < new Date('2015-08-01');
});

// Just required fields
out = _.map(out, function(pull) {
  return {
    id: pull.id,
    title: pull.title,
    body: pull.body,
    created_at: new Date(pull.created_at).toISOString().slice(0, 10),
    user: pull.user.login
  };
});

console.log(_.template(template, {variable: 'pulls'})(out));
