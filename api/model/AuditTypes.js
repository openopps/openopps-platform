module.exports = {
  // Authentication events
  'UNAUTHENTICATED_ACCESS': {
    action: 'UNAUTHENTICATED_ACCESS',
    description: 'A user has attempted to access an authenticated boundary in Open Opportunities, but is not logged in.',
    severity: 'info',
    data: ['path', 'method'],
  },
  'FORBIDDEN_ACCESS': {
    action: 'FORBIDDEN_ACCESS',
    description: 'A user has attempted to access a protected boundary in Open Opportunities, but does not have the proper permissions.',
    severity: 'alert',
    data: ['path', 'method'],
  },
  'UNAUTHORIZED_APPLICATION_ACCESS': {
    action: 'UNAUTHORIZED_APPLICATION_ACCESS',
    description: 'An unauthorized USAJOBS user has attempted to access Open Opportunities.',
    severity: 'warn',
    data: ['documentId'],
  },
  'UNKNOWN_USER_PROFILE_FIND': {
    action: 'UNKNOWN_USER_PROFILE_FIND',
    description: 'A USAJOBS user has attempted to link to an Open Opportunities profile, but no profile exist.',
    severity: 'info',
    data: ['documentId', 'email'],
  },
  // Account events
  'ACCOUNT_CREATED': {
    action: 'ACCOUNT_CREATED',
    description: 'New Open Opportunities account was created.',
    severity: 'info',
    data: ['userId'],
  },
  'ACCOUNT_ENABLED_DISABLED': {
    action: 'ACCOUNT_ENABLED_DISABLED',
    description: 'An Open Opportunities account has been enabled or disabled.',
    severity: 'info',
    data: ['userId', 'action'],
  },
  'UNATHORIZED_ACCOUNT_ENABLED_DISABLED': {
    action: 'ACCOUNT_ENABLED_DISABLED',
    description: 'An unauthorzied attempt was made to enable or disable on Open Opportunities account.',
    severity: 'alert',
    data: ['userId', 'action'],
  },
  'ACCOUNT_UPDATED': {
    action: 'ACCOUNT_UPDATED',
    description: 'An Open Opportunities account has been modified.',
    severity: 'info',
    data: ['userId', 'section'],
  },
  'UNAUTHORIZED_ACCOUNT_UPDATED': {
    action: 'UNAUTHORIZED_ACCOUNT_UPDATED',
    description: 'An unauthorized attempt was made to modify an Open Opportunities account.',
    severity: 'alert',
    data: ['userId'],
  },
  'ACCOUNT_PERMISSION_UPDATED': {
    action: 'ACCOUNT_PERMISSION_UPDATED',
    description: 'An Open Opportunities account permission has been modified.',
    severity: 'alert',
    data: ['userId', 'action'],
  },
  'ACCOUNT_LOGIN': {
    action: 'ACCOUNT_LOGIN',
    description: 'An Open Opportunities account login attempt.',
    severity: 'info',
    data: ['userId'],
  },
  'PASSWORD_RESET': {
    action: 'PASSWORD_RESET',
    description: 'An Open Opportunities password reset attempt.',
    severity: 'info',
    data: ['userId'],
  },
  // Task events
  'TASK_CHANGE_OWNER': {
    action: 'TASK_CHANGE_OWNER',
    description: 'Ownership of a task is transferred from one user to another user.',
    severity: 'info',
    data: ['taskId', 'originalOwner', 'newOwner'],
  },
  'TASK_ADD_PARTICIPANT': {
    action: 'TASK_ADD_PARTICIPANT',
    description: 'A new user is added to the applicant pool for an opportunity.',
    severity: 'info',
    data: ['taskId', 'participant'],
  },
  'COMMUNITY_ADD_MEMBER': {
    action: 'COMMUNITY_ADD_MEMBER',
    description: 'A new user is added as a member of a community.',
    severity: 'info',
    data: ['communityId', 'userId'],
  },
  'COMMUNITY_MEMBERSHIP_UPDATED': {
    action: 'COMMUNITY_MEMBERSHIP_UPDATED',
    description: 'A user\'s membership has been reactivated or revoked from a community.',
    severity: 'info',
    data: ['communityId', 'userId', 'action'],
  },
};