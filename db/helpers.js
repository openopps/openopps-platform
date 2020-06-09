const _ = require('lodash');

module.exports = {};

module.exports.update = (tableName, conditions = {}, data = {}) => {
  const dKeys = Object.keys(data);
  const dataTuples = dKeys.map((k, index) => {
    if (k.match(/[A-Z]/)) {
      return `"${k}" = $${index + 1}`
    } else {
      return `${k} = $${index + 1}`
    }
  });
  const updates = dataTuples.join(', ');
  const len = Object.keys(data).length;

  var text = `UPDATE ${tableName} SET ${updates}`;

  if (!_.isEmpty(conditions)) {
    const keys = Object.keys(conditions);
    const condTuples = keys.map((k, index) => `${k} = $${index + 1 + len} `);
    const condPlaceholders = condTuples.join(' AND ');

    text += ` WHERE ${condPlaceholders} RETURNING *`;
  }

  const values = [];
  Object.keys(data).forEach(key => {
    values.push(data[key]);
  });
  Object.keys(conditions).forEach(key => {
    values.push(conditions[key]);
  });

  return { text, values };
};

module.exports.insert = (tableName, data) => {
  if(!_.isArray(data)) {
    data = [data];
  }
  const dKeys = Object.keys(data[0]);
  const dataTuples = dKeys.map(k => {
    if (k.match(/[A-Z]/)) {
      return `"${k}"`
    } else {
      return `${k}`
    }
  });
  const columnNames = dataTuples.join(', ');

  var text = `INSERT INTO ${tableName} (${columnNames}) VALUES `;

  const values = [];
  data.forEach(item => {
    var dataValues = Object.values(item).map(v => {
      if (_.isDate(v)) {
        return "'" + v.toISOString() + "'";
      } else if(_.isObject(v)) {
        return "'" + JSON.stringify(v) + "'";
      } else if (_.isString(v)) {
        return "'" + v + "'";
      } else {
        return v;
      }
    })
    values.push(`(${dataValues.join(', ')})`);
  });

  text += values.join(', ');

  return text;
};