const setup = require('../app/openopps-setup');
const { Pool } = require('pg');
const pool = new Pool(setup.dbConfig);

const client = {};

client.query = async function (text, params) {
  const start = Date.now();
  var result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: result.rowCount });
  return result;
};

module.exports = client;