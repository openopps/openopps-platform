var _ = require('underscore');

function LikeActions(req, res, type) {
  this.req = req;
  this.res = res;
  this.type = type;
}

_.extend(LikeActions.prototype, {
  like: function() {
    var liker = new Liker(this.res, this.queryOptions());
    this.findOne(liker.handler());
  },

  unlike: function() {
    var unliker = new Unliker(this.res);
    this.findOne(unliker.handler());
  },

  queryOptions: function(type) {
    var options = { userId: this.req.user[0].id};
    options[this.type] = this.req.params.id;
    return options;
  },

  findOne: function(callback) {
    Like.findOne({where: this.queryOptions()}).exec(function(err, record) {
      if (err) { return callback(err); }
      callback(record);
    });
  }
});

function Liker(res, options) {
  this.res = res;
  this.options = options;
}

_.extend(Liker.prototype, {
  handler: function() {
    return this.afterFind.bind(this);
  },

  afterFind: function(record) {
    if (record) { return this.respond(null, record); }
    Like.create(this.options, this.handleCreated.bind(this));
  },

  handleCreated: function(err, record) {
    if (err) { return this.respond(err, null); }
    return this.respond(null, record);
  },

  respond: function(err, record) {
    if (err) { return this.res.send(400, { message: 'Error creating like.' }); }
    return this.res.send(record);
  }
});

function Unliker(res) {
  this.res = res;
}

_.extend(Unliker.prototype, {
  handler: function() {
    return this.afterFind.bind(this);
  },

  afterFind: function(record) {
    if (!record) { return this.respond(null); }

    record.destroy(this.respond.bind(this));
  },

  respond: function(err) {
    if (err) { return this.res.send(400, { message: 'Error destroying like.' }); }
    return this.res.send(null);
  }
});


module.exports = LikeActions;

