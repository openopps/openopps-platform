
// Do some checking could make sure db is good for example
const elasticClient = require('../elastic');
const elasticInitilizer = require('../elastic/initializer');

module.exports = async () => {
  await elasticInitilizer.InitializeTaskTemplate(elasticClient);
};
