const _ = require('lodash');
const dao = require('postgres-gen-dao');


module.exports = function (db) {
  return {
    Notification: dao({ db: db, table: 'notification' }),
    NotificationMonitor: dao({ db: db, table: 'notification_monitor' }),
    User: dao({ db: db, table: 'midas_user' }),
  };
};
