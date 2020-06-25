const _ = require('lodash');
var dao = require('postgres-gen-dao');

const tagByType = 'select @tagentity.* from @tagentity tagentity where tagentity.type = ?';

const userByName = 'select midas_user.id, midas_user.name, midas_user.title, midas_user.username, midas_user.government_uri ' +
  'from midas_user where disabled = false and hiring_path in (\'fed\', \'contractor\') and LOWER(name) like ?';

const userByNameOrEmail = 'select midas_user.id, midas_user.name, midas_user.title, midas_user.username, midas_user.government_uri ' +
'from midas_user where disabled = false and hiring_path in (\'fed\', \'contractor\') and (lower(username) like $1 or lower(government_uri) like $1 or lower(name) like $1 )';

const agencyQuery = 'select * from agency where is_disabled = false and parent_code is not null and (lower(name) like ? or lower(abbr) like ?)';

const languageQuery=' select language.language_id,language.value from language where LOWER(value) like ? and language.is_disabled = false';

const countryQuery='select country.country_id,country.code,country.value from country where LOWER(value) like ? order by country.value';

const stateQuery='select country_subdivision.country_subdivision_id,country_subdivision.code,country_subdivision.value from country_subdivision where LOWER(value) like ? and parent_code = ? order by country_subdivision.value';

const agencyAutocompleteQuery = `select agency_id as id, name, abbr from (
	select ROW_NUMBER() over (order by agency_id), agency_id, name, abbr from agency where lower(abbr) like ? and parent_code is not null and is_disabled = false
	union select 5 + ROW_NUMBER() over (order by agency_id), agency_id, name, abbr from agency where lower("name") like ? and parent_code is not null
) a order by row_number limit 5`;

const departmentAutocompleteQuery = `select agency_id as id, name, abbr from (
	select ROW_NUMBER() over (order by agency_id), agency_id, name, abbr from agency where lower(abbr) like ? and length(code) = 2 AND is_disabled = FALSE
	union select 5 + ROW_NUMBER() over (order by agency_id), agency_id, name, abbr from agency where lower("name") like ? and length(code) = 2 AND is_disabled = FALSE
) a order by row_number limit 5`;

const tagAutocompleteQuery = 'select id, name from tagentity where type = ? and lower(name) like ? limit 5';

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
      agencyAutocomplete: agencyAutocompleteQuery,
      departmentAutocomplete: departmentAutocompleteQuery,
      tagAutocomplete: tagAutocompleteQuery,
      userByNameOrEmail:userByNameOrEmail,
    },
    options: options,
  };
};
