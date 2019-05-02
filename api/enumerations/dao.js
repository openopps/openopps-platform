const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);

module.exports = {};
const queries = {
  findRecords: 'SELECT bureau.bureau_id, office.office_id, office.name as office_name, bureau.name as bureau_name ' +
    'FROM bureau left join office on bureau.bureau_id = office.bureau_id order by bureau.bureau_id',
};
module.exports.getBureausAll = function () {
  return new Promise(resolve => {
    db.query(queries.findRecords).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Error retrieving bureaus');
      resolve();
    });
  });
};