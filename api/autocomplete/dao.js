const _ = require('lodash');
var dao = require('postgres-gen-dao');

const tagByType = 'select @tagentity.* from @tagentity tagentity where tagentity.type = ?';

const userByName = 'select midas_user.id, midas_user.name, midas_user.title, midas_user.username, midas_user.government_uri ' +
  'from midas_user where disabled = false and hiring_path = \'fed\' and LOWER(name) like ?';

const agencyQuery = 'select * from agency where is_disabled = false and parent_code is not null and (lower(name) like ? or lower(abbr) like ?)';

const languageQuery=' select language.language_id,language.value from language where LOWER(value) like ?';

const countryQuery='select country.country_id,country.code,country.value from country where LOWER(value) like ?';

const stateQuery='select country_subdivision.country_subdivision_id,country_subdivision.code,country_subdivision.value from country_subdivision where LOWER(value) like ? and parent_code = ?';

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
    Language:dao({db:db,table:'language'}),
    Country:dao({db:db,table:'country'}),
    CountrySubdivision:dao({db:db,table:'country_subdivision'}),
    query: {
      tagByType: tagByType,
      userByName: userByName,
      agency: agencyQuery,
      language:languageQuery,
      country:countryQuery,
      state: stateQuery,
    },
    options: options,
  };
};
