const setup = require('../app/openopps-setup');
const elasticsearch = require('elasticsearch');

var isAlive = false;
var lastCheck = 0;
var client = new elasticsearch.Client(setup.elasticConfig);

client.IsAlive = async function () {
  var now = new Date();
  if (now - lastCheck >= 10000)
  {
    lastCheck = now;
    try {
      var result = await client.ping({ requestTimeout: 3000 });
      if (!result) {
        console.trace('elasticsearch cluster is down!');
        isAlive = false;
      } else {
        if (!isAlive)
        {
          console.trace('elasticsearch is up!');
        }
        isAlive = true;
      }
    } catch(err) {
      console.trace('elasticsearch cluster is down!');
      isAlive = false;
    }
  }  
  return isAlive;
};

module.exports = client;