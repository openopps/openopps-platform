const setup = require('../app/openopps-setup');
const { Pool } = require('pg');
const pool = new Pool(setup.dbConfig);
const { update } = require('./helpers');

const client = {};

client.query = async function (text, params) {
  const start = Date.now();
  var result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: result.rowCount });
  return result;
};

client.update = async (entity, conditions, fields) => {
  if (!entity)
    throw new Error('no entity table specified');
  if (_.isEmpty(conditions))
    throw new Error('no conditions specified');

  const { text, values } = update(entity, conditions, fields);

  try {
    var result = await pool.query(text, values);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (err) {
    log.error(err);
    throw err;
  }
};

module.exports = client;