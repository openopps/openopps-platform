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
  var covid19_alert = `INSERT INTO alert (title, description, end_date, community_id)
    VALUES (
      '',
      '<strong><a style="color:#212121" href="/community/COVID19">COVID-19 Response Program</a></strong> - In response to the National Emergency declared for Coronavirus Disease 2019 (COVID-19), federal agencies can post details, micro-details, and temporary rotational assignments on the platform for federal employees who can support the COVID-19 response.',
      '2020-12-31 23:59:59',
      (select community_id from community where vanity_url = 'COVID19')
    ) RETURNING alert_id`;
  db.all(covid19_alert, (err, results) => {
    if (err) {
      callback(err);
    } else {
      Promise.all([
        db.runSql(`INSERT INTO alert_location_bridge (alert_id, alert_location_id) VALUES (?, (select alert_location_id from alert_location where location = 'index'))`, [results[0].alert_id]),
        db.runSql(`INSERT INTO alert_location_bridge (alert_id, alert_location_id) VALUES (?, (select alert_location_id from alert_location where location = 'search'))`, [results[0].alert_id]),
      ]).then(() => {
        callback();
      }).catch(callback);
    }
  });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
