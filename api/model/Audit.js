const _ = require('lodash');

const AuditTypes = require('./AuditTypes');

function getRole (user) {
  return user.isAdmin ?
    'Admin' : user.isAgencyAdmin ? 
      'Agency Admin' : 'General User';
}

module.exports = {
  createAudit: (type, ctx, auditData) => {
    var user = (ctx.state.user || { id: 0 });
    var audit = _.cloneDeep(AuditTypes[type]);
    audit.userId = user.id;
    audit.role = auditData.role || getRole(user);
    audit.source = (ctx.headers['true-client-ip'] || ctx.ip || '');
    audit.status = auditData.status || '';
    audit.dateInserted = new Date();
    audit.data = _.reduce(audit.data, (result, key) => {
      result[key] = auditData[key];
      return result;
    }, {});
    return audit;
  },
};