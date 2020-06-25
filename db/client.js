const setup = require('../app/openopps-setup');
const { Pool } = require('pg');
const pool = new Pool(setup.dbConfig);
const { update, insert } = require('./helpers');
const _ = require('lodash');

const client = {};

client.query = async function (text, params) {
  const start = Date.now();
  var result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: result.rowCount });
  return result;
};

/**
 * @param {string} entity table name
 * @param {Array} conditions key value pair of colum name and value
 * @param {Array} fields key value pair of colum name and value
 */
client.update = async (entity, conditions, fields) => {
  if (!entity)
    throw new Error('no entity table specified');
  if (_.isEmpty(conditions))
    throw new Error('no conditions specified');

  const { text, values } = update(entity, conditions, fields);

  try {
    const start = Date.now();
    var result = await pool.query(text, values);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (err) {
    log.error(err);
    throw err;
  }
};

/**
 * @param {string} entity table name
 * @param {Array} values array of objects to insert 
 */
client.insert = (entity, values) => {
  if (!entity)
    throw new Error('no entity table specified');
  if (_.isEmpty(values))
    throw new Error('no values specified');

  const text = insert(entity, values);

  try {
    return client.query(text);
  } catch (err) {
    log.error(err);
    throw err;
  }
};

/**
 * @param {Array} queries array of queries to be run.
 *  Each value can be text or parameterized query { text, values }
 */
client.transaction = async queries => {
  const start = Date.now();
  var transaction = await pool.connect();
  try {
    await transaction.query('BEGIN');
    for (var i = 0; i < queries.length; i++) {
      await transaction.query(queries[i]);
    }
    await transaction.query('COMMIT');
    const duration = Date.now() - start;
    console.log('executed transaction', { queries, duration });
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    transaction.release();
  }
};

module.exports = client;