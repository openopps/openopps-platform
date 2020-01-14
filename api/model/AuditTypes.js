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
  'TASK_UPDATED': {
    action: 'TASK_UPDATED',
    description: 'A user has made changes to an opportunity.',
    severity: 'info',
    data: ['taskId', 'previous', 'changes'],
  },
  'TASK_DELETED': {
    action: 'TASK_DELETED',
    description: 'A user has deleted an opportunity.',
    severity: 'info',
    data: ['taskId', 'creator', 'title'],
  },
  'INTERNSHIP_CANCELED': {
    action: 'INTERNSHIP_CANCELED',
    description: 'A user has canceled an internship.',
    severity: 'info',
    data: ['taskId','title','user', 'taskCreator'],
  },
  //Volunteer events
  'VOLUNTEER_DELETED': {
    action: 'VOLUNTEER_DELETED',
    description: 'A user has removed a volunteer',
    severity: 'info',
    data: ['volunteerId','taskId','user','volunteer','reason'],
  },

  //Application events
  'APPLICATION_SUBMITTED': {
    action: 'APPLICATION_SUBMITTED',
    description: 'An application was submitted by the user.',
    severity: 'info',
    data: ['applicationId', 'userId', 'createdAt', 'updatedAt'],
  },
  'APPLICATION_UPDATED': {
    action: 'APPLICATION_UPDATED',
    description: 'An application was updated by the user.',
    severity: 'info',
    data: ['applicationId', 'userId', 'updatedAt'],
  },
  'APPLICATION_WITHDRAWN': {
    action: 'APPLICATION_WITHDRAWN',
    description: 'An application was withdrawn by the user.',
    severity: 'info',
    data: ['applicationId', 'cycleId', 'userId'],
  },
  // Community events
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
  // Data export events
  'DATA_EXPORTED': {
    action: 'DATA_EXPORTED',
    description: 'A user has exported data from the system.',
    severity: 'info',
    data: ['userId', 'action'],
  },
  //Bureau events
  'BUREAU_UPDATED': {
    action: 'BUREAU_UPDATED',
    description: 'A user has made changes to the bureau.',
    severity: 'info',
    data: ['bureauId','user', 'previous', 'changes'],
  },
  'BUREAU_ADDED': {
    action: 'BUREAU_ADDED',
    description: 'A new bureau is added.',
    severity: 'info',
    data: ['bureauId', 'user', 'bureauName'],
  },
  
  'BUREAU_DELETED': {
    action: 'BUREAU_DELETED',
    description: 'A bureau is deleted.',
    severity: 'info',
    data: ['bureauId', 'user','offices'],
  },
  //Office events
  'OFFICE_UPDATED': {
    action: 'OFFICE_UPDATED',
    description: 'A user has made changes to the office.',
    severity: 'info',
    data: ['officeId','user', 'previous', 'changes'],
  },
  'OFFICE_ADDED': {
    action: 'OFFICE_ADDED',
    description: 'A new office is added.',
    severity: 'info',
    data: ['bureauId','user','officeId', 'user', 'officeName'],
  },
  'OFFICE_DELETED': {
    action: 'OFFICE_DELETED',
    description: 'An office is deleted.',
    severity: 'info',
    data: ['bureauId','officeId', 'user','officeName'],
  },
  // API events
  'PHASE_STARTED': {
    action: 'PHASE_STARTED',
    description: 'The boards have been drawn and the phase has begun.',
    severity: 'info',
    data: ['cycleId', 'phaseId', 'results'],
  },
};