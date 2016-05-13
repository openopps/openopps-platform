var tags = {
  oneTime: {
    name: 'One time',
    type: 'task-time-required'
  },
  ongoing: {
    name: 'Ongoing',
    type: 'task-time-required'
  }
};

module.exports = {
  'draft': {
    state: 'draft',
    title: '',
    description: '',
    userId: 1,
  },
  'submitted': {
    state: 'submitted',
    title: '',
    description: '',
    userId: 1,
  },
  'open': {
    state: 'open',
    title: 'Validate USDA Data',
    description: 'Some addresses in the USDA Meat & Poultry Inspection Directory need validating and correcting to ensure they can be leveraged for geospatial mapping. You will determine if the address is suitable for mapping or mailing. Get a quick intro to geo-spatial analysis and help make food inspection more efficient.',
    userId: 1,
  },
  'assigned': {
    state: 'assigned',
    title: 'Assigned Task',
    description: 'description of the assigned task',
    userId: 1,
  },
  'completed': {
    state: 'completed',
    title: 'Completed Task',
    description: 'description of the completed task',
    userId: 1,
  },
  'archived': {
    state: 'archived',
    title: 'Archived Task',
    description: 'description of the archived task',
    userId: 1,
  },
  'oneTimeSubmitted': {
    title: 'Fake one time task',
    state: 'submitted',
    userId: 1,
    tags: [tags.oneTime]
  },
  'oneTimeOpen': {
    title: 'Fake one time task',
    state: 'open',
    userId: 1,
    tags: [tags.oneTime]
  },
  'oneTime': {
    title: 'Fake one time task',
    userId: 1,
    tags: [tags.oneTime]
  },
  'anotherTime': {
    title: 'Second fake one time task',
    userId: 1,
    tags: [tags.oneTime]
  },
  'ongoing': {
    title: 'Fake ongoing task',
    userId: 1,
    tags: [tags.ongoing]
  },
  'anotherOngoing': {
    title: 'Second fake ongoing task',
    userId: 1,
    tags: [tags.ongoing]
  }

}
