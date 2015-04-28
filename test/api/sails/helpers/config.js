module.exports = {
  // used if no other user is specified
  'defaultUser': {
    'username': 'tester1@midascrowd.com',
    'password': 'TestTest123#'
  },
  // for the user.test.js suite
  'testUser': {
    'name': 'Midas User',
    'username': 'testuser@midascrowd.com',
    'password': 'MidasTestM4$'
  },
  // for the admin test suite
  'adminUser': {
    'username': 'admin@midascrowd.com',
    'password': 'Adm1nTest123$#'
  },
  'testPasswordResetUser': {
    'username': 'testreset@midascrowd.com',
    'password': 'Test123$',
    'newpassword': 'FooBar123#'
  },
  'url': 'http://localhost:1337/api',
  'sails': {
      log: {
        level: 'error'
      },
      adapters: {
        'default': 'disk'
      }
    },
  'project': {
    'title': 'Project Title',
    'description': 'Project Description'
  },
  'tasks': [
    {
      'title': 'task1',
      'description': 'description1',
      'creatorId': 1
    },
    {
      'title': 'task2',
      'description': 'description2',
      'creatorId': 1
    }
  ],
  'tags': [
    {
      'type': 'skill',
      'name': 'Tag1'
    },
    {
      'type': 'skill',
      'name': 'Tag2'
    },
    {
      'type': 'office',
      'name': 'Tag3'
    },
    {
      'type': 'location',
      'name': 'San Francisco'
    }
  ]
};
