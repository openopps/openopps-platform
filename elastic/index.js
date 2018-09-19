const setup = require('../app/openopps-setup');
const elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client(setup.elasticConfig);

module.exports = client;