/*
 * Script for importing historical participants and updating task data
 *
 * - To run, download a spreadsheet as defined here: https://github.com/18F/midas/issues/1039#issuecomment-148751267
 * - Save spreadsheet as `participants.txt` in the same directory as this script
 * - From this directory, run this script with `node ./importParticipants.js`
 *
 * The script will add participants for any rows in the spreadsheet that do not already exist. It will also
 * update tasks with information (like `task_state` or `completion_date`) specified in the spreadsheet.
 *
 */

var async = require('async'),
    csv = require('csv'),
    fs = require('fs'),
    Sails = require('sails'),
    importData = fs.readFileSync(__dirname + '/participants.txt', 'utf8');

csv.parse(importData, {
  columns: true
}, startSails);

function startSails(err, data) {
  if (err) throw err;

  Sails.lift({
    port: 9999,
    smtp: {
      service: '',
      host: 'smtp.example.com',
      auth: {
        user: '',
        pass: ''
      }
    }
  }, runImport);

  function runImport(err, sails) {
    console.log('runImport...');

    if (err) throw err;

    async.eachSeries(data, processRow, sails.lower);

  }

  function processRow(row, done) {
    console.log('processRow...');

    updateTask(row, function(err) {
      if (err) throw err;
      getUser(row, finish);
    });

    function finish(err) {
      console.log('finish...');

      if (err) throw err;

      // Traffic cop
      setTimeout(done, 100);

    }
  }

}

function getUser(row, done) {
  console.log('getUser...');

  if (!row.task_id || !row.participant_email) return done();

  var username = row.participant_email
        .toLowerCase()
        .trim()
        .replace(/,|;/g, '')
        .replace(/\s/g, ''),
      user = {
        username: username
      },
      profile = {
        username: username,
        name: row.participant_name,
        disabled: !!row.diabled
      };

  console.log(user, profile);
  User.findOrCreate(user, profile).exec(createParticipant);

  function createParticipant(err, user) {
    console.log('createParticipant...');

    if (err) throw err;
    var volunteer = { taskId: +row.task_id, userId: user.id };
    console.log(user, volunteer);
    Volunteer.findOrCreate(volunteer, volunteer).exec(updateVol);

  }

  function updateVol(err, volunteer) {
    // Also update volunteer records dates
    Task.findOne(+row.task_id).exec(function(err, task) {
      if (err) return done(err);

      var volDate = task.assignedAt || task.createdAt;

      if (!volDate || !new Date(volDate)) return done();

      Volunteer.update(volunteer.id, { createdAt: new Date(volDate) }).exec(done);
    });

  }

}

function updateTask(row, done) {
  console.log('updateTask...');

  var date = new Date(row.completion_date);

  if (!row.task_state || !row.completion_date || !date) return done();

  console.log('Updating task ' + row.task_id  + ' to state ' + row.task_state);

  // Has to be two steps to avoid automatically setting the date
  Task.update({ id: +row.task_id }, { id: +row.task_id, state: row.task_state }).exec(function(err) {
    if (err) return done(err);
    console.log('Updating task ' + row.task_id  + ' to date ' + date);

    Task.update({ id: +row.task_id }, { id: +row.task_id, completedAt: date }).exec(done);
  });
}
