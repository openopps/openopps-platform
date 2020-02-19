const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);

module.exports = {};
const queries = {
  findRecords: 'SELECT bureau.bureau_id, office.office_id, office.name as office_name,office.is_disabled as is_disabled,bureau.name as bureau_name ' +
    'FROM bureau left join office on bureau.bureau_id = office.bureau_id where bureau.is_disabled = false order by bureau.bureau_id',

  findPayLevelRecords: 'select pay_plan.pay_plan_id,pay_plan.code,pay_plan.value from pay_plan order by pay_plan.value',
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
module.exports.getPayLevelAll = function () {
  return new Promise(resolve => {
    db.query(queries.findPayLevelRecords).then(async (record) => {    
      resolve(record);
    }).catch(() => {
      console.log('Error retrieving paylevel records');
      resolve();
    });
  });
};