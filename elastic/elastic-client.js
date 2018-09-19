const  elasticsearch = require('elasticsearch');

var config = {
  host: [
    {
      host: process.env.ELASTIC_HOST || 'localhost',
      port: process.env.ELASTIC_PORT || 9200,
      protocol: process.env.ELASTIC_PROTOCOL || 'https',
      auth: process.env.ELASTIC_AUTH || '',
    },
  ],
};

var client = new elasticsearch.Client(config);

module.exports.elasticClient = client;