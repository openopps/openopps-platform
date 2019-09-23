const path = require('path');

// easy loading of a feature
loadFeature = function (name) {
  return require('./' + name + '/controller');
};

module.exports = (app) => {
  app.use(loadFeature('cycle'));
  app.use(loadFeature('faker'));
  app.use(loadFeature('application'));
  app.use(loadFeature('opportunity'));
  app.use(loadFeature('user'));
};