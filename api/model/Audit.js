const _ = require('lodash');

const AuditTypes = {
  'TASK_CHANGE_OWNER': {
    action: 'TASK_CHANGE_OWNER',
    description: 'Ownership of a task is transferred from one user to another user.',
    data: ['taskId', 'originalOwner', 'newOwner'],
  },
  'TASK_ADD_PARTICIPANT': {
    action: 'TASK_ADD_PARTICIPANT',
    description: 'A new user is added to the applicant pool for an opportunity.',
    data: ['taskId', 'participant'],
  },
  'UNAUTHORIZED_APPLICATION_ACCESS': {
    action: 'UNAUTHORIZED_APPLICATION_ACCESS',
    description: 'An unauthorized USAJOBS user has attempted to access Open Opportunities.',
    data: ['documentId'],
  },
  'UNKNOWN_USER_PROFILE_FIND': {
    action: 'UNKNOWN_USER_PROFILE_FIND',
    description: 'A USAJOBS user has attempted to link to an Open Opportunities profile, but no profile exist.',
    data: ['documentId', 'email'],
  },
};

function getRole (user) {
  return user.isAdmin ?
    'Admin' : user.isAgencyAdmin ? 
      'Agency Admin' : 'General User';
}

module.exports = {
  createAudit: (type, user, auditData) => {
    var audit = _.cloneDeep(AuditTypes[type]);
    audit.userId = user.id;
    audit.role = getRole(user);
    audit.dateInserted = new Date();
    audit.data = _.reduce(audit.data, (result, key) => {
      result[key] = auditData[key];
      return result;
    }, {});
    return audit;
  },
};