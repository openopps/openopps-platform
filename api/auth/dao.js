const _ = require('lodash');
var dao = require('postgres-gen-dao');

const userQuery = 'select @m_user.*, @agency.*, @tags.* ' +
  'from @midas_user m_user ' +
  'left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id ' +
  'left join @tagentity tags on tags.id = user_tags.tagentity_users ' +
  'left join @agency on agency.agency_id = m_user.agency_id ' +
  'where m_user.disabled = false and m_user.id = ?';

const tagEntityQuery = 'select tagentity_users__user_tags.* ' +
  'from tagentity_users__user_tags ' +
  'join tagentity on tagentity.id = tagentity_users ' +
  'where type= ? and user_tags = ?';

const options = {
  user: {
    fetch: {
      tags: [],
      agency: '',
    },
    exclude: {
      m_user: [ 'deletedAt', 'createdAt', 'updatedAt', 'passwordAttempts', 'disabled' ],
      tags: [ 'deletedAt', 'createdAt', 'updatedAt' ],
    },
  },
  badge: {
    exclude: [ 'deletedAt', 'createdAt', 'updatedAt' ],
  },
};

const clean = {
  user: function (user) {
    var cleaned = _.pickBy(user, _.identity);
    cleaned.tags = cleaned.tags.map(tag => {
      return _.pickBy(tag, _.identity);
    });
    cleaned.badges = cleaned.badges.map(badge => {
      return _.pickBy(badge, _.identity);
    });
    return cleaned;
  },
};

module.exports = function (db) {
  return {
    AccountStaging: dao({ db: db, table: 'account_staging' }),
    Agency: dao({ db: db, table: 'agency' }),
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Badge: dao({ db: db, table: 'badge' }),
    CommunityUser: dao({ db: db, table: 'community_user' }),
    Passport: dao({ db: db, table: 'passport' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    User: dao({ db: db, table: 'midas_user' }),
    UserPasswordReset: dao({ db: db, table: 'userpasswordreset' }),
    UserTags: dao({ db: db, table: 'tagentity_users__user_tags' }),
    query: {
      user: userQuery,
      tagEntity: tagEntityQuery,
    },
    options: options,
    clean: clean,
  };
};
