const dao = require('./dao');
const _ = require('lodash');

module.exports = {};

module.exports.getBureausAll = async function () {
  var bureau_data = await dao.getBureausAll();
  var bureaus = [];
  
  var currentBureau = {};
  var previousBureau = { bureauId: -1 };
  for (var i = 0; i < bureau_data.length; i++) {
    if (bureau_data[i].bureau_name == 'Undersecretary for Political Affairs (P)') {
      var p = 1;
    }
    if (bureau_data[i].bureau_id != previousBureau.bureauId) {
      if (i != 0) {
        bureaus.push(currentBureau);
      }
      currentBureau = {
        bureauId: bureau_data[i].bureau_id,
        name: bureau_data[i].bureau_name,
        offices: [],
      };
    }

    if (bureau_data[i].office_id != null) {
      currentBureau.offices.push({ id: bureau_data[i].office_id, text: bureau_data[i].office_name});
      currentBureau.offices= _.sortBy(currentBureau.offices, 'text');
      
    }
    if (i == bureau_data.length - 1) {
      bureaus.push(currentBureau);
    }
    previousBureau = currentBureau;
  }

  return bureaus;
};