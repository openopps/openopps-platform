const db = require('../../db/client');

module.exports = {};

/**
 * Get all system settings
 */
module.exports.getAll = function () {
  // TODO: Wrap in promise to return rows or reject on error
  return new Promise((resolve, reject) => {
      db.query({
      name: 'fetch-all-system-settings',
      text: 'SELECT * FROM system_setting ORDER BY system_setting_id',
    }).then(queryResult => {
      resolve(queryResult.rows);
    }).catch(reject);
  });
};

/**
 * Get system setting by key
 * 
 * @param { string } key system_key
 */
module.exports.get = function (key) {
  return new Promise((resolve, reject) => {
    db.query({
      name: 'fetch-system-setting',
      text: 'SELECT * FROM system_setting WHERE key = $1',
      values: [key],
    }).then(queryResult => {
      resolve(queryResult.rows);
    }).catch(reject);;
  });
};

/**
 * Save changes to system setting
 * 
 * @param { string } key
 * @param { string } value
 * @param { number } userId id of user making the change
 */
module.exports.save = function (key, value, userId) {
  return db.query({
    name: 'update-system-setting',
    text: 'UPDATE system_setting SET value = $1, user_id = $2, updated_at = now() WHERE key = $3 RETURNING *',
    values: [value, userId, key],
  })
};