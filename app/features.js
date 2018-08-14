const path = require('path');

// easy loading of a feature
loadFeature = function (name) {
  return require(path.join('../api', name, 'controller'));
};

module.exports = (app) => {
  app.use(loadFeature('auth'));
  app.use(loadFeature('opportunity'));
  app.use(loadFeature('user'));
  app.use(loadFeature('autocomplete'));
  app.use(loadFeature('location'));
  app.use(loadFeature('admin'));
  app.use(loadFeature('volunteer'));
  app.use(loadFeature('activity'));
  app.use(loadFeature('comment'));
  app.use(loadFeature('document'));
  app.use(loadFeature('announcement'));
};