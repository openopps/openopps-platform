console.log('Loading... ', __filename);

/**
 * Policies are simply Express middleware functions which run before your controllers.
 * You can apply one or more policies for a given controller or action.
 *
 * Any policy file (e.g. `authenticated.js`) can be dropped into the `/policies` folder,
 * at which point it can be accessed below by its filename, minus the extension, (e.g. `authenticated`)
 *
 * For more information on policies, check out:
 * http://sailsjs.org/#documentation
 */


module.exports.policies = {

  // default require authentication
  // see api/policies/authenticated.js
  '*': ['passport', 'authenticated', 'addUserId'],

  // Main rendering controller
  // Passes sspi policy through for auto-login systems
  MainController : {
    '*': ['sspi']
  },

  ActivityController: ['passport', 'authenticated', 'requireUserId'],

  // Only admins can access the AdminController API
  AdminController : {
    '*': ['passport', 'authenticated', 'admin'],
    'agency': ['passport', 'authenticated', 'agencyAdmin']
  },

  // Auth controller can be accessed by anyone
  AuthController : {
    '*': true
  },

  // Limit user controller view to just the /user endpoint
  UserController : {
    '*': false,
    'profile': ['passport', 'authenticated'],
    'photo': ['passport', 'authenticated', 'requireId'],
    'info': ['passport', 'authenticated', 'requireId'],
    'update': ['passport', 'authenticated', 'requireUserId', 'requireId', 'user', 'protectAdmin'],
    'username': ['passport', 'authenticated'],
    'find': ['passport', 'authenticated', 'requireUserId'],
    'all': ['passport', 'authenticated', 'requireUserId'],
    'findOne': ['passport', 'authenticated', 'requireUserId'],
    'activities': ['passport', 'authenticated'],
    'disable': ['passport', 'authenticated', 'requireId', 'requireUserId'],
    'enable': ['passport', 'authenticated', 'requireId', 'requireUserId', 'admin'],
    'resetPassword': ['passport', 'authenticated', 'requireUserId'],
    'emailCount': ['test'],
    'export': ['passport', 'authenticated', 'admin']
  },

  UserSettingController : {
    '*': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'find': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'findOne': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'destroy': ['passport', 'authenticated', 'requireUserId', 'requireId','userSettingIdMatch']
  },

  // Disable the index blueprints for FileController due to security concerns
  FileController : {
    'index': false,
    'findAll': 'admin',
    // for testing
    'test': true,
    'testupload': true,
    // everything else is protected
    '*': ['passport', 'protectedFile']
  },

  ProjectController : {
    '*': ['passport', 'authenticated', 'addUserId', 'project'],
    'find': ['passport', 'authenticated', 'requireId', 'project'],
    'findOne': ['passport', 'authenticated', 'requireId', 'project'],
    'update': ['passport', 'authenticated', 'requireUserId', 'requireId', 'project', 'ownerOrAdmin'],
    'destroy': ['passport', 'authenticated', 'requireUserId', 'requireId', 'project', 'ownerOrAdmin']
  },

  ProjectOwnerController : {
    '*': false,
    'create': ['passport', 'authenticated', 'requireUserId', 'projectId'],
    'destroy': ['passport', 'authenticated', 'requireUserId', 'requireId']
  },

  LikeController : {
    '*': ['passport', 'authenticated', 'addUserId'],
    'count': ['passport', 'authenticated', 'requireId', 'project'],
    'countt': ['passport', 'authenticated', 'requireId', 'task'],
    'countu': ['passport', 'authenticated', 'requireId', 'requireUserId'],
    'like': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'liket': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'likeu': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'unlike': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'unliket': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'unlikeu': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'create': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'destroy': false,
    'update': false
  },

  VolunteerController : {
    '*': false,
    'create': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'destroy': ['passport', 'authenticated', 'requireUserId', 'requireId', 'volunteer', 'ownerOrAdmin'],
  },

  EventController : {
    '*': false,
    'find': ['passport', 'authenticated'],
    'findOne': ['passport', 'authenticated'],
    'create': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'projectId', 'eventUuid'],
    'update': ['passport', 'authenticated', 'requireUserId', 'projectId'],
    'findAllByProjectId': ['passport', 'authenticated', 'addUserId', 'requireId', 'project'],
    'attend': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'cancel': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'requireId'],
    'rsvp': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'ical': ['passport', 'authenticated', 'addUserId', 'project'],
    'destroy': ['passport', 'authenticated', 'requireId', 'admin']
  },

  CommentController : {
    'find': false,
    'findOne': false,
    'create': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'projectId', 'taskId'],
    'update': ['passport', 'authenticated', 'requireUserId', 'projectId', 'taskId', 'comment', 'ownerOrAdmin'],
    'destroy': ['passport', 'authenticated', 'requireUserId', 'requireId', 'admin'],
    'findAllByProjectId': ['passport', 'authenticated', 'requireId', 'project'],
    'findAllByTaskId': ['passport', 'authenticated', 'requireId', 'task']
  },

  TagEntityController : {
    '*': ['passport', 'authenticated'],
    'update': ['passport', 'authenticated', 'admin'],
    'destroy': ['passport', 'authenticated', 'admin']
  },

  TaskController : {
    'find': ['passport', 'authenticated', 'task'],
    'findOne': ['passport', 'authenticated', 'task'],
    'findAllByProjectId': ['passport', 'authenticated', 'requireId', 'project'],
    'copy': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'create': ['passport', 'authenticated', 'requireUserId', 'addUserId'],
    'update': ['passport', 'authenticated', 'requireUserId', 'requireId', 'projectId', 'task', 'ownerOrAdmin'],
    'destroy': ['passport', 'authenticated', 'requireUserId', 'requireId', 'task', 'ownerOrAdmin'],
    'export': ['passport', 'authenticated', 'admin']
  },

  AttachmentController: {
    'find': ['passport', 'authenticated', 'requireId'],
    'findOne': ['passport', 'authenticated', 'requireId'],
    'findAllByProjectId': ['passport', 'authenticated', 'requireId', 'project'],
    'findAllByTaskId': ['passport', 'authenticated', 'requireId', 'task'],
    'create': ['passport', 'authenticated', 'requireUserId', 'addUserId', 'attachment'],
    'update': false,
    'destroy': ['passport', 'authenticated', 'requireUserId']
  },

  SearchController : {
    '*': true
  }
};
