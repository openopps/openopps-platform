const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = (db) => {
  return {
    Badge: dao({ db: db, table: 'badge'}),
  };
};
