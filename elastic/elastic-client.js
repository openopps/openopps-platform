const  elasticsearch = require('elasticsearch');

var config = {
  host: process.env.ELASTIC_HOST || 'localhost:9200',
  httpauth: process.env.ELASTIC_AITH || ''
};

var client = new elasticsearch.Client(config);

module.exports.elasticClient = client;