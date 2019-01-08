const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Community: dao({ db: db, table: 'community' }),
    CommunityUser: dao({ db: db, table: 'community_user' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    User: dao({ db: db, table: 'midas_user' }),
  };
};
