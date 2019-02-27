const path = require('path');

// easy loading of a feature
loadFeature = function (name) {
  return require('./' + name + '/controller');
};

module.exports = (app) => {
  app.use(loadFeature('opportunity'));
};