/**
 * User
 *
 * @module      :: Model
 * @description :: User representation
 *
 */

var exportUtils = require('../services/utils/export');

module.exports = {
  tableName: 'midas_user',
  attributes: {
    // Login information
    username: 'STRING',

    // Core attributes about a user
    name: 'STRING',

    // Professional Title
    title: 'STRING',

    // Biography
    bio: 'STRING',

    // User's profile photo
    // If photoId is not null, the URL to the file is /file/get/:id
    photoId: 'INTEGER',
    // If photoUrl is not null, then an external provider gave us the photo
    // Use the URL directly as the resource identifier for the photo.
    photoUrl: 'STRING',

    // User metadata for service delivery
    isAdmin: {
      type: 'BOOLEAN',
      defaultsTo: false
    },

    // is the user's login disabled
    disabled: {
      type: 'BOOLEAN',
      defaultsTo: false
    },

    // Store the number of invalid password attempts
    passwordAttempts: {
      type: 'INTEGER',
      defaultsTo: 0
    },

    // Tag association
    tags: {
      collection: 'tagEntity',
      via: 'users',
      dominant: true
    }
  },

  exportFormat: {
    'user_id': 'id',
    'name': {field: 'name', filter: exportUtils.nullToEmptyString},
    'username': {field: 'username', filter: exportUtils.nullToEmptyString},
    'title': {field: 'title', filter: exportUtils.nullToEmptyString},
    'agency': {field: 'agency', src: 'tags', filter: exportUtils.getAgency},
    'location': {field: 'location', src: 'tags', filter: exportUtils.getLocation},
    'bio': {field: 'bio', filter: exportUtils.nullToEmptyString},
    'admin': 'isAdmin',
    'disabled': 'disabled'
  }

};
