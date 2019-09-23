'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  var query = 'INSERT INTO announcement(title, "userId", "createdAt", "updatedAt", description) ' +
    'VALUES (?, ?, ?, ?, ?);';
  var title = 'OPM\'s USAJOBS is proud to announce the launch of Acquisition Open Opportunities.';
  var description = '<p>We’ve partnered with OMB’s Office of Federal Procurement Policy (OFPP) and ' +
    'the Federal Acquisition Institute to launch the new <a href="/tasks?career=Acquisition">Acquisition ' +
    'Open Opportunities</a> portal. You can now search for opportunities within the Acquisitions career ' +
    'field. <a href="https://youtu.be/6qdmmeB9yIc" target="_blank">Check out this video<i class="fas ' +
    'fa-external-link-alt"></i></a> from Lesley Field, Deputy Administrator of OFPP to learn more.</p> ' +
    '<img class="img-responsive" src="/images/home/landing_acquisition.png" alt="Acquisition screenshot">';
  var date = new Date();
  db.runSql(query, [title, 0, date, date, description], callback);
};

exports.down = function (db, callback) {
  db.runSql('delete from announcement where "userId" = 0;', callback);
};
