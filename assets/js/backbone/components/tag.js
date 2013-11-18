/**
 * This is a configuration file that defines the standard
 * tags for this installation.  The tags will be displayed
 * in the order of the array.
 */
define({
  // This defines all of the tag elements for use in the app
  tags: {

    skill: {
      'icon': 'icon-atom',
      'class': 'skill',
      'id': 'skill',
      'type': 'skill',
      'name': 'Skill',
      'plural': 'Skills'
    },

    topic: {
      'icon': 'icon-briefcase',
      'class': 'topic',
      'id': 'topic',
      'type': 'topic',
      'name': 'Topic',
      'plural': 'Topics'
    },

    agency: {
      'icon': 'icon-library',
      'class': 'agency',
      'id': 'agency',
      'type': 'agency',
      'name': 'Agency',
      'plural': 'Agencies'
    },

    location: {
      'icon': 'icon-map-marker',
      'class': 'location',
      'id': 'location',
      'type': 'location',
      'name': 'Location',
      'plural': 'Locations'
    },

    skillsRequired: {
      id    : 'task-skills-required',
      type  : 'skillsRequired',
      name  : 'Skills Required',
      klass : 'task-skills-required'
    },

    timeRequired: {
      id    : 'task-time-required',
      type  : 'timeRequired',
      name  : 'Time Required',
      klass : 'task-time-required'
    },

    people: {
      id    : 'task-people',
      type  : 'people',
      name  : 'People',
      klass : 'task-people'
    },

    length: {
      id    : 'task-length',
      type  : 'length',
      name  : 'Length',
      klass : 'task-length'
    },

    timeEstimates: {
      id    : 'task-time-estimates',
      type  : 'timeEstimates',
      name  : 'Time Estimates',
      klass : 'task-time-estimatesx'
    }

  },

  // This defines the part of the app and which tags apply
  // plural names are for searching the collection
  // singular names are for the individual show views.
  project   : ['skill', 'topic', 'agency', 'location'],
  projects  : ['skill', 'topic', 'agency', 'location'],

  profile   : ['skill', 'topic'],
  profiles  : ['skill', 'topic', 'agency', 'location'],

  task      : ['skill', 'topic', 'skillsRequired', 'timeRequired', 'people', 'length', 'timeEstimates'],
  tasks     : ['skill', 'topic', 'agency', 'location', 'skillsRequired', 'timeRequired', 'people', 'length', 'timeEstimates']
});
