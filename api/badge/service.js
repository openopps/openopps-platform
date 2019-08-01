const _ = require('lodash');
const db = require('../../db');
const dao = require('./dao')(db);
const badgeDescriptions = require('../../utils').badgeDescriptions;
var Notification;

const badgeExists = 'Badge already exists';

/**
 * if the badge was not explicitly set to be silent
 * send out a notification to the user
 * @param { Object } badge inserted badge object
 */
function afterCreate (badge) {
  return new Promise(function (resolve, reject) {
    if (badge.silent === true) {
      resolve({ badge: badge });
    } else {
      dao.Badge.db.query('select username, name, government_uri as "governmentUri", bounced from midas_user where id = ?', badge.user).then(function (results) {
        var data = {
          action: 'badge.create.owner',
          model: {
            user: results.rows[0],
            badge: {
              type: badge.type,
              description: badgeDescriptions[badge.type],
            },
          },
        };
        try {
          if(!data.model.user.bounced) {
            Notification.createNotification(data);
          }
        } finally {
          resolve({ badge: badge });
        }
      }).catch(reject);
    }
  });
}

function save (badge) {
  return new Promise(function (resolve, reject) {
    dao.Badge.find('type = $type and "user" = $user', badge).then((result) => {
      if(result.length > 0) {
        resolve({ badge: result[0] });
      } else {
        dao.Badge.insert(badge).then(function (result) {
          afterCreate(result).then(resolve, reject);
        }).catch(reject);
      }
    }, (err) => {
      reject(err);
    });
  });
}

module.exports = (notification) => {
  Notification = notification;
  return {
    find: dao.Badge.find,
    findOne: dao.Badge.findOne,
    save: save,
  };
};
