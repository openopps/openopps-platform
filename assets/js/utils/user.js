var _ = require('underscore');

// Wrapper for server User class
class User {
  constructor(data) {
      // initialize with data that comes from server, backendUser or /user/:id
      // to be compatible with prior usage of raw object
      for (var i in data) {
        this[i] = data[i];
      }
  }
  get agency() {
    var agencyTag = _(this.tags).findWhere({ type: 'agency' });

    // ideally this would be its own object
    return { id: agencyTag.id,
             name: agencyTag.name,
             abbr: agencyTag.data.abbr,
             domain: agencyTag.data.domain[0],
             slug: agencyTag.data.abbr.toLowerCase()
           }
  }

}

export default User;
