const path = require('path');

// easy loading of a feature
loadFeature = function (name) {
  return require(path.join('../api', name, 'controller'));
};

module.exports = (app) => {
  app.use(loadFeature('activity'));
  app.use(loadFeature('admin'));
  app.use(loadFeature('announcement'));
  app.use(loadFeature('auth'));
  app.use(loadFeature('autocomplete'));
  app.use(loadFeature('comment'));
  app.use(loadFeature('community'));
  app.use(loadFeature('document'));
  app.use(loadFeature('location'));
  app.use(loadFeature('lookup'));
  app.use(loadFeature('opportunity'));
  app.use(loadFeature('user'));
  app.use(loadFeature('volunteer'));
};