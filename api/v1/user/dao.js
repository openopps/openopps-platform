const pgdao = require('postgres-gen-dao');

var dao = {};
dao.query = {};

module.exports = function (db) {
    dao.User = pgdao({ db: db, table: 'midas_user' }),
    dao.TaskShare = pgdao({ db: db, table: 'task_share' });
    return dao;
};