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
    create or replace function get_applicant_language_score_by_task (p_task_id int8) 
    returns table (
      task_id int4,
      application_id int8,
      reading_score numeric,
      writing_score numeric,
      speaking_score numeric,
      language_score numeric,
      weighted_language_score float8
    ) 
    as $$
    begin
    return QUERY select
        t.id as task_id,
        app.application_id,
        sum(readScore.score) as reading_score,
        sum(writeScore.score) as writing_score,
        sum(speakScore.score) as speaking_score,
        sum(readScore.score + writeScore.score + speakScore.score) as language_score,    
        sum((readScore.score + writeScore.score + speakScore.score) * ls.weight_factor) as weighted_language_score
      from
        application_language_skill als
        inner join language_proficiency_score readScore on als.reading_proficiency_id = readScore.proficiency_id
        inner join language_proficiency_score writeScore on als.writing_proficiency_id = writeScore.proficiency_id
        inner join language_proficiency_score speakScore on als.speaking_proficiency_id = speakScore.proficiency_id
        inner join application app on als.application_id = app.application_id
        cross join (
          select * from task where id = p_task_id
        ) t
        inner join language_skill ls on t.id = ls.task_id and als.language_id = ls.language_id
      group by t.id, app.application_id;
    end; $$ 
    
    language 'plpgsql';
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop function get_applicant_language_score_by_task(bigint)', callback);
}

exports._meta = {
 'version': 1,
};
