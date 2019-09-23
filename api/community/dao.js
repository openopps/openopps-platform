const _ = require('lodash');
const dao = require('postgres-gen-dao');

const communityDetailsQuery = 'SELECT ' +
  '@community.community_id, @community.community_name, ' +
  '@cycles.* ' +
  'FROM @community community ' +
  'LEFT JOIN @cycle cycles ON cycles.community_id = community.community_id ' +
  'WHERE community.target_audience = ?';

const communitiesQuery = 'SELECT ' +
  'community.community_id, ' +
  'community.community_name, ' +
  'community.target_audience ' +
  'FROM community ' +
  'WHERE ' +
    'community.is_closed_group = false ' +
  'UNION ' +
  'SELECT ' +
    'community.community_id, ' +
    'community.community_name, ' +
    'community.target_audience ' +
  'FROM community ' +
  'JOIN community_user ' +
    'ON community_user.community_id = community.community_id ' +
  'WHERE ' +
    'community.is_closed_group = true ' +
    'AND community_user.user_id = ?';

module.exports = function (db) {
  return {
    Agency: dao({ db: db, table: 'agency' }),
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Community: dao({ db: db, table: 'community' }),
    CommunityUser: dao({ db: db, table: 'community_user' }),
    Cycle: dao({ db: db, table: 'cycle' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    User: dao({ db: db, table: 'midas_user' }),
    query: {
      communityDetails: communityDetailsQuery,
      communitiesQuery: communitiesQuery,
    },
  };
};
