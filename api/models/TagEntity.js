/**
 * TagEntity
 *
 * @module      :: Model
 * @description :: Storage of each of the tags with type and name
 *                 to be reused and referenced by id
 *
 */
module.exports = {

  attributes: {
    // type of the tag (such as 'skill' for Skill)
    type: 'STRING',
    // name of the tag (display name)
    name: 'STRING',
    // arbitrary data attributes, like coordinates and time zones for locations
    data: 'JSON',

    // models
    users: {
      collection: 'user',
      via: 'tags'
    },
    tasks: {
      collection: 'task',
      via: 'tags'
    }
  }

};
