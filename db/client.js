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
    throw new Error('no fields specified');

  const text = insert(entity, values);

  try {
    return client.query(text);
  } catch (err) {
    log.error(err);
    throw err;
  }
};

module.exports = client;