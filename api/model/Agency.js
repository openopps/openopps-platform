const _ = require('lodash');
const db = require('../../db/client');

module.exports = {};

module.exports.toList = function (agency) {
  if(agency && agency.parent) {
    return [_.pick(agency, ['agency_id', 'abbr', 'name'])].concat(this.toList(agency.parent));
  } else {
    return [_.pick(agency, ['agency_id', 'abbr', 'name'])];
  }
};

module.exports.fetchAgency = function (agencyId) {
  return new Promise(async (resolve, reject) => {
    // TODO: load agency
    db.query('select * from agency where agency_id = $1', [agencyId]).then(results => {
      var agency = results.rows[0];
      console.log('Located agency: ', agency);
      if (agency.parent_code + '00' == agency.code) {
        // TODO: If agency is agency wide parent then look for my actual parent and its agency wide record
        db.query('select parent_code from agency where code = $1', [agency.parent_code]).then(result => {
          if (result.rows[0] && result.rows[0].parent_code) {
            db.query('select agency_id from agency where code = $1', [result.rows[0].parent_code + '00']).then(result => {
              if(result.rows[0]) {
                console.log('Parent id located: ', result.rows[0]);
                this.fetchAgency(result.rows[0].agency_id).then(parent => {
                  agency.parent = parent;
                  resolve(agency);
                }).catch(reject);
              } else {
                console.log('No parent resolving agency');
                resolve(agency);
              }
            });
          } else {
            resolve(agency);
          }
        }).catch(reject);
      } else {
        // TODO: Look for agency wide parent (code = parent_code + '00')
        db.query('select agency_id from agency where code = $1', [agency.parent_code + '00']).then(result => {
          if(result.rows[0]) {
            console.log('Parent id located: ', result.rows[0]);
            this.fetchAgency(result.rows[0].agency_id).then(parent => {
              agency.parent = parent;
              resolve(agency);
            }).catch(reject);
          } else {
            console.log('No parent resolving agency');
            resolve(agency);
          }
        });
      }
    }).catch(reject);
  });
};