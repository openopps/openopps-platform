const elasticsearch = require('elasticsearch');
const fs = require("fs");
/**
 * @param {elasticsearch.Client} client 
 */
module.exports = async (client) => {
    // configure elastic
    if(!client || typeof(client)==='undefined'){
        console.warn("Elasic client not configured!");
        return;
    }
    var settings_file = JSON.parse(fs.readFileSync("./elastic/task_settings.json"));
    var mappings_file = JSON.parse(fs.readFileSync("./elastic/task_mapping.json"));
    await client.indices.putTemplate({
        name: "task_template",
        order: 1,
        create: false,
        body: {
            index_patterns: ["task*"],
            settings: settings_file,
            mappings: mappings_file
        }
    }).catch((reason) => {
        console.error(reason);
    });
};