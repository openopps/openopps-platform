const elasticsearch = require('elasticsearch');
const fs = require('fs');

var initalizer = exports;

/**
 * @param {elasticsearch.Client} client 
 */
initalizer.InitializeTaskTemplate = async function (client) {
  if(!client || typeof(client)==='undefined'){
    console.warn('Elasic client not configured!');
    return;
  }
  var settings_file = JSON.parse(fs.readFileSync('./elastic/task_settings.json'));
  var mappings_file = JSON.parse(fs.readFileSync('./elastic/task_mapping.json'));
  await client.indices.putTemplate({
    name: 'task_template',
    order: 1,
    create: false,
    body: {
      template: 'task*',
      index_patterns: ['task*'],
      settings: settings_file,
      mappings: mappings_file,
    },
  }).catch((reason) => {
    console.error(reason);
  }).then(() => {
    console.log('updated task_template template');
  });
};

/**
 * @param {elasticsearch.Client} client 
 */
initalizer.InitializeUserTemplate = async function (client) {
  if(!client || typeof(client)==='undefined'){
    console.warn('Elasic client not configured!');
    return;
  }
  var settings_file = JSON.parse(fs.readFileSync('./elastic/user_settings.json'));
  var mappings_file = JSON.parse(fs.readFileSync('./elastic/user_mapping.json'));
  await client.indices.putTemplate({
    name: 'user_template',
    order: 1,
    create: false,
    body: {
      template: 'user*',
      index_patterns: ['user*'],
      settings: settings_file,
      mappings: mappings_file,
    },
  }).catch((reason) => {
    console.error(reason);
  }).then(() => {
    console.log('updated user_template template');
  });
};
