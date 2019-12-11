'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return Promise.all([
    db.runSql("INSERT INTO system_setting (key, value, display, updated_at, user_id) VALUES ('creatorSurveyURL', 'https://www.surveymonkey.com/results/SM-HDMN37TQ7/', 'Creator survey link', now(), 0)"),
    db.runSql("INSERT INTO system_setting (key, value, display, updated_at, user_id) VALUES ('participantSurveyURL', 'https://www.surveymonkey.com/results/SM-PXYV7DTQ7/', 'Participant survery link', now(), 0)")
  ]);
};

exports.down = function(db) {
  return Promise.all([
    db.runSql('DELETE FROM system_setting where key = \'creatorSurveyURL\''),
    db.runSql('DELETE FROM system_setting where key = \'participantSurveyURL\''),
  ]);
};

exports._meta = {
  "version": 1
};
