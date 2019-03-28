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

exports.up = function (db, callback) {
  db.runSql(`
    create view applicant_language_score as
      select
        task.id as task_id,
        app.application_id,
        als.language_id,
        readScore.score as reading_score,
        writeScore.score as writing_score,
        speakScore.score as speaking_score,
        (readScore.score + writeScore.score + speakScore.score) as language_score,	
        ls.weight_factor as language_weight_factor,
        (readScore.score + writeScore.score + speakScore.score) * ls.weight_factor as weighted_language_score
      from
        application_language_skill als
        inner join language_proficiency_score readScore on als.reading_proficiency_id = readScore.proficiency_id
        inner join language_proficiency_score writeScore on als.writing_proficiency_id = writeScore.proficiency_id
        inner join language_proficiency_score speakScore on als.speaking_proficiency_id = speakScore.proficiency_id
        inner join application app on als.application_id = app.application_id
        inner join application_task appt on app.application_id = appt.application_id
        inner join task on appt.task_id = task.id
        inner join language_skill ls on task.id = ls.task_id and als.language_id = ls.language_id
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop view applicant_language_score', callback);
}

exports._meta = {
 'version': 1,
};
