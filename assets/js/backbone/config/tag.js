/**
 * This is a configuration file that defines the standard
 * tags for this installation.  The tags will be displayed
 * in the order of the array.
 */
module.exports = {
  // This defines all of the tag elements for use in the app
  tags: {
    'skill': {
      'icon': 'fa fa-cog',
      'class': 'skill',
      'id': 'skill',
      'type': 'skill',
      'name': 'Skill',
      'plural': 'Skills',
      'profileEdit': 'I have experience with',
    },

    'topic': {
      'icon': 'fa fa-tags',
      'class': 'topic',
      'id': 'topic',
      'type': 'topic',
      'name': 'Interest',
      'plural': 'Interests',
      'profileEdit': 'I want to develop',
    },

    'agency': {
      'icon': 'icon-library',
      'class': 'agency',
      'id': 'agency',
      'type': 'agency',
      'name': 'Agency',
      'plural': 'Agencies',
    },

    'location': {
      'icon': 'fa fa-map-marker',
      'class': 'location',
      'id': 'location',
      'type': 'location',
      'name': 'Work location',
      'plural': 'Work locations',
    },

    // ---
    // Task-specific tags
    // ---
    'task-skills-required': {
      'icon': 'fa fa-map-marker',
      'class': 'task-skills-required',
      'id': 'task-skills-required',
      'type': 'task-skills-required',
      'name': 'Skill Required',
      'plural': 'Skills Required',
    },

    'task-time-required': {
      'icon': 'far fa-calendar',
      'class': 'task-time-required',
      'id': 'task-time-required',
      'type': 'task-time-required',
      'name': 'Time commitment',
      'plural': 'Time commitment',
    },

    'task-people': {
      'icon': 'fa fa-group',
      'class': 'task-people',
      'id': 'task-people',
      'type': 'task-people',
      'name': 'Personnel needed',
      'plural': 'Personnel needed',
    },

    'task-length': {
      'icon': 'fa fa-bullseye',
      'class': 'task-length',
      'id': 'task-length',
      'type': 'task-length',
      'name': 'Deadline',
      'plural': 'Deadline',
    },

    'task-time-estimate': {
      'icon': 'far fa-clock',
      'class': 'task-time-estimate',
      'id': 'task-time-estimate',
      'type': 'task-time-estimate',
      'name': 'Estimated Time Required',
      'plural': 'Estimated Time Required',
    },

  },

  // This defines the part of the app and which tags apply
  // plural names are for searching the collection
  // singular names are for the individual show views.
  profile   : ['skill', 'topic'],
  profiles  : ['skill', 'topic', 'agency', 'location'],

  task      : ['skill', 'topic', 'location', 'task-people', 'task-time-estimate', 'task-time-required', 'task-length'],
  tasks     : ['skill', 'topic', 'agency', 'location', 'task-skills-required', 'task-time-required', 'task-people', 'task-length', 'task-time-estimate'],
};
