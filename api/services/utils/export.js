var _ = require('underscore');
var json2csv = require('json2csv');
var moment = require('moment')

module.exports = {

  /**
   * Given a set of records, render to an string in CSV format. Includes column
   * headers. Use json2csv module to take care of escapes and such.
   *
   * @param model -- an exportFormat object to describe what list to output. Each
   *        field maps the output column to the input field. If the input field is
   *        a string then it's a simple fetch, if it's an object itself then it should
   *        have a field member for the fetch, and a format field for the function to
   *        apply to that field.
   * @param records -- array of records to dump out
   * @param done(error, buffer) -- callback. if error then message in first
   *        parameter, if OK then error should be null and rendered result in buffer.
   */
  renderCSV: function (model, records, done) {
    sails.log.verbose('renderCSV');
    var output = "";
    var fieldNames = _.keys(model.exportFormat);
    var fields = _.values(model.exportFormat);

    // clean up records
    fields.forEach(function (field, fIndex, fields) {
      if (typeof(field) === "object") {
        records.forEach(function (rec, rIndex, records) {
          records[rIndex][field.field] = field.filter.call(this, rec[field.field]);
        });
        fields[fIndex] = field.field;
      }
    });

    json2csv({
      data: records,
      fields: fields,
      fieldNames: fieldNames
    }, function (err, csv) {
      if (err) {
        done(err);
      }
      output += csv + "\n";
    });
    done(null, output);
  },

  /**
   * Format a date as a string that imports nicely into Excel. Uses the nice momentjs
   * library to do the heavy lifting.
   */
  excelDateFormat: function (date) {
    return date != null ? moment(date).format("YYYY-MM-DD HH:mm:ss") : "";
  },

  /**
   * By default json2csv prints nulls as "null" instead of an empty string, which looks ugly
   * in reports. This filter takes care of that.
   */
  nullToEmptyString: function (str) {
    return str ? str : "";
  }

};
