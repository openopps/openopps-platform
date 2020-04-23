/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  // default require authentication
  // see api/policies/requireAuth.js
  '*': 'requireAuth',

  // Main rendering controller, allow open access to homepage
  MainController : {
    '*': true
  },


  ActivityController: {
    '*': ['requireAuth', 'addUserId']
  },

  AdminController : {
    '*': 'admin',
  },

  AttachmentController : {
    '*': 'requireAuth',
    'findAllBytaskId': true
  },

  // Auth controller can be accessed by anyone
  AuthController : {
    '*': true
  },

  AcController : {
    'tag': true,
    'location': true
  },

  CommentController : {
    '*': false,   // defualt to no access
    'find': false,
    'findOne': false,
    'create': ['requireAuth', 'requireId', 'addUserId', 'authorizeTask'],
    'update': ['requireAuth', 'requireId', 'authorizeTask', 'comment', 'ownerOrAdmin'],
    'destroy': ['requireAuth', 'requireId', 'admin'],
    'findAllByTaskId': ['requireId', 'authorizeTask']
  },

  LocationController : {
    'suggest': true
  },

  SearchController : {
    '*': true
  },

  TagEntityController : {
    '*': false,   // defualt to no access
    '*': ['requireAuth'],
    'update': ['admin'],
    'destroy': ['admin']
  },

  TaskController : {
    '*': false,   // defualt to no access
    'find': true,
    'findOne': true,
    'copy': ['requireAuth', 'addUserId'],
    'create': ['requireAuth', 'addUserId'],
    'update': ['requireAuth', 'requireId', 'addUserId', 'authorizeTask', 'ownerOrAdmin'],
    'destroy': ['requireAuth', 'requireId','authorizeTask', 'ownerOrAdmin'],
    'export': ['admin']
  },

  // Disable the index blueprints for UploadController due to security concerns
  UploadController : {
    'index': false,
    'findAll': 'admin',
    // everything else is protected (limits access for private files)
    '*': 'protectFile'
  },

  UserController : {
    '*': false,
    'profile': true,
    'find': true,
    'findOne': 'requireId',
    'photo': 'requireId',
    'info': 'requireId',
    'update': ['requireAuth', 'requireId', 'user'],
    'username': true,
    'all': 'requireAuth',
    'activities': 'requireAuth',
    'disable': ['requireAuth', 'requireId', 'admin'],
    'enable': ['requireAuth', 'requireId', 'admin'],
    'resetPassword': 'requireAuth',
    'export': 'admin'
  },

  VolunteerController : {
    '*': false,
    'create': ['requireAuth', 'addUserId'],
    'destroy': ['requireAuth', 'addUserId', 'requireId', 'ownerOrAdmin'],
  },


};
