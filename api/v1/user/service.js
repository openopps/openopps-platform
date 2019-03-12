const db = require('../../../db');
const dao = require('./dao')(db);

var service = {};

service.getUserPreferences = async function(userId) {
    var preferences = {};
    preferences.userPermissions = [];
    var user = await dao.User.findOne("id = ?", userId);
    var result = await dao.TaskShare.find("user_id = ?", userId);

    preferences.isOOAdmin = user.isAdmin;
    preferences.isOOAgencyAdmin = user.isAgencyAdmin;
    preferences.governmentURI = user.governmentURI;
    if (user.isAdmin || result.length > 0)
    {
        preferences.userPermissions.push('View Review Board');
    }
    return preferences;
}

module.exports = service;