const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    Announcement: dao({ db, table: 'announcement' }),
  };
};