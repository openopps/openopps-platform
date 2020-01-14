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

exports.up = function(db, callback) {
  db.runSql(`
    WITH dup_badges AS (
      SELECT
        COUNT(*), MAX(badge.id) as badge_id, "user", type, midas_user.name
      FROM badge
      JOIN midas_user ON midas_user.id = badge.user
      GROUP BY "user", "type", midas_user.name
      HAVING COUNT(*) > 1
    )

    DELETE FROM badge WHERE badge.id in (SELECT dup_badges.badge_id FROM dup_badges)
  `,
  callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
