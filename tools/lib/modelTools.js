var _ = require('lodash');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var Converter = require("csvtojson").Converter;

module.exports = {
  importFromFile: function(model, filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error("File Not Found: '" + filepath + "'");
    }
    console.log("importing:", filepath);
    var converter = new Converter({});
    return new Promise(function(resolve, reject) {
      converter.on("end_parsed", function (attrList) {
        return resolve(model.create(attrList));
      });
      converter.on("error", reject);
      require("fs").createReadStream(filepath).pipe(converter);
    });

  },

  importTasksFromFile: function(filepath) {
    console.log("importing:", filepath);
    if (fs.existsSync(filepath)) {
      input = fs.readFileSync(filepath);
      var attrList = parse(input, {columns: true});
      var date = new Date();
      return Task.create(attrList);
    } else {
      var msg = "File Not Found: '" + filepath + "'"
      console.log(msg)
      throw new Error(msg);
    }
  }
}
