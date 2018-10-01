const request = require('request');

module.exports = {
  dataTypes: {
    agency: { value: 'agencysubelements', table: 'agency' },
    academicHonors: { value: 'academichonors', table: 'academic_honors' },
    degreeTypeCodes: { value: 'degreetypecodes', table: 'degree_type' },
    languageCodes: { value: 'languagecodes', table: 'language' },
    languageProficiencies: { value: 'languageproficiencies', table: 'language_proficiency' },
    referenceTypeCodes: { value: 'refereetypecodes', table: 'reference_type' },
    securityClearanceCodes: { value: 'securityclearances', table: 'security_clearance' },
  },
  import: (dataType) => {
    if (dataType == 'all') {
      Object.keys(module.exports.dataTypes).forEach(function (key) {
        this.import(this.dataTypes[key]);
      }.bind(module.exports));
    } else {
      request(process.env.DATA_IMPORT_URL + dataType.value, (error, response, body) => {
        console.log('Importing data for ' + dataType.value);
        if(error || !response || response.statusCode != 200) {
          console.log('Error importing data for ' + dataType.value, error, (response || {}).statusCode);
        } else {
          var values = JSON.parse(body).CodeList[0].ValidValue;
          console.log('Got ' + values.length + ' values for ' + dataType.value);
        }
      });
    }
  },
};

module.exports.import('all');