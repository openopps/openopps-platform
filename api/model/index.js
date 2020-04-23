const validGovtDomains = require('../../config/domains');

module.exports = {
  Task: require('./Task'),
  User: require('./User'),
  Badge: require('./Badge'),
  ValidGovtEmail: (email) => {
    return validGovtDomains.domains.filter(domain => {
      return email.match(domain);
    }).length > 0;
  },
};
