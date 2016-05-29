//
// helpers for creating models
//
var taskFixtures = require('../../fixtures/task');

module.exports = {
  createUsers: function(numUsers, domain) {
    var userAttrs = [];
    domain = domain || "gmail.com"

    for (var i = 0; i < numUsers; i++) {
      userAttrs.push(
        {
          'name': i.toString(),
          'username': i.toString() + '@' + domain,
          'password': 'TestTest123#'
        }
      );
    }
    return User.create(userAttrs);
  },

  // default owner id is 1
  // optional: options.owner
  createTasks: function(numTasks, options) {
    var attrs = [];
    var ownerId = 1
    if (options.owner) ownerId = options.owner.id;

    for (var i = 0; i < numTasks; i++) {
      attrs.push(
        {
          title: 'task ' + i.toString(),
          state: 'open',
          userId: ownerId,
          tags: taskFixtures.oneTimeOpen.tags
        }
      );
    }
    return Task.create(attrs);
  }

}
