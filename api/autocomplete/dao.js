const _ = require('lodash');
var dao = require('postgres-gen-dao');

const tagByType = 'select @tagentity.* from @tagentity tagentity where tagentity.type = ?';

const userByName = 'select midas_user.id, midas_user.name, midas_user.title from midas_user where disabled = false and LOWER(name) like ?';

const agencyQuery = 'select * from agency where parent_code is not null and (lower(name) like ? or lower(abbr) like ?)';

const options = {
  tagByType: {
    exclude: {
      tagentity: [ 'deletedAt' ],
    },
  },
};

module.exports = function (db) {
  return {
    Agency: dao({ db: db, table: 'agency' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    User: dao({ db: db, table: 'midas_user' }),
    query: {
      tagByType: tagByType,
      userByName: userByName,
      agency: agencyQuery,
    },
    options: options,
  };
};
