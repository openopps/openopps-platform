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
    create or replace function get_applicant_language_score (p_cycle_id int8) 
    returns table (
      task_id int4,
      application_id int8,
      language_id int4,
      reading_score numeric,
      writing_score numeric,
      speaking_score numeric,
      language_score numeric,
      language_weight_factor float4,
      weighted_language_score float8
    ) 
    as $$
    begin
    return QUERY select
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
      inner join task on app.cycle_id = task.cycle_id and app.community_id = task.community_id
      inner join language_skill ls on task.id = ls.task_id and als.language_id = ls.language_id
    where
      task.cycle_id = p_cycle_id;
    end; $$ 
    
    language 'plpgsql';
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop function get_applicant_language_score(bigint)', callback);
}

exports._meta = {
 'version': 1,
};
