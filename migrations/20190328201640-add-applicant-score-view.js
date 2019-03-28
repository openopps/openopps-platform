'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
 exports.up = function (db, callback) {
  db.runSql(`
    create view applicant_score as
      select
        t.id as task_id,
        app.application_id,
        app.cumulative_gpa,
        app.random_factor,
        t.random_weight,
        app.random_factor * t.random_weight as weighted_random_factor,
        case
          when gpa_range.max_gpa - gpa_range.min_gpa = 0 then 0
          else ((app.cumulative_gpa - gpa_range.min_gpa) / (gpa_range.max_gpa - gpa_range.min_gpa)) * 10.0
        end as weighted_gpa
      from
        application app
        inner join application_task appt on app.application_id = appt.application_id
        inner join task t on appt.task_id = t.id
        inner join (
          select max(cumulative_gpa) max_gpa, min(cumulative_gpa) min_gpa, community_id, cycle_id
          from application
          group by community_id, cycle_id
        ) gpa_range on app.community_id = gpa_range.community_id and app.cycle_id = gpa_range.cycle_id
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop view applicant_score', callback);
}

exports._meta = {
 'version': 1,
};