const pgdao = require('postgres-gen-dao');

var dao = {};
dao.query = {};

module.exports = function (db) {
    dao.User = pgdao({ db: db, table: 'midas_user' }),
    dao.CommunityUser = pgdao({ db: db, table: 'community_user' });
    return dao;
};