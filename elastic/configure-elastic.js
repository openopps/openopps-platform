
var config = {
  host: process.env.ELASTIC_URL || 'http://localhost:9200',
};

module.exports.elasticConfig = config;