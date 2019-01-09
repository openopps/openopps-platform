const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Cycle: dao({ db: db, table: 'cycle' }),
  };
};
