const _ = require('lodash');
const log = require('log')('app:alert:service');
const db = require('../../db/client');
const fs = require('fs');
const path = require('path');

module.exports = {};

module.exports.getAlerts = function () {
  return new Promise((resolve, reject) => {
    db.query({
      text: fs.readFileSync(path.join(__dirname, 'sql/getAlerts.sql'), 'utf8'),
      values: [new Date()],
    }).then(queryResult => {
      resolve(queryResult.rows);
    }).catch(reject);
  });
};

module.exports.getAlertsForPage = function (page) {
  return new Promise((resolve, reject) => {
    db.query({
      text: fs.readFileSync(path.join(__dirname, 'sql/getAlertsForPage.sql'), 'utf8'),
      values: [page, new Date()],
    }).then(queryResult => {
      resolve(queryResult.rows);
    }).catch(reject);
  });
};