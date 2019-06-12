var _ = require('underscore');
var Backbone = require('backbone');


var ProfileModel = Backbone.Model.extend({

  urlRoot: '/api/user',

  initialize: function () {
    this.initializeProfileSave();
    this.initializeProfileGet();
  },

  parse: function (res, options) {
    // Remove falsy values (db returns null instead of undefined)
    _(res).each(function (v, k, o) { if (!v) delete o[k]; });
    //res.agency = _(res.tags).findWhere({ type: 'agency' });
    res.location = _(res.tags).findWhere({ type: 'location' });
    return res;
  },

  initializeProfileGet: function () {
    var self = this;

    this.listenTo(this, 'profile:fetch', function (id) {
      self.remoteGet(id);
    });
  },

  remoteGet: function (id) {
    var self = this;
    if (id) {
      this.set({ id: id });
    }
    this.fetch({
      success: function (model, response, options) {
        self.trigger('profile:fetch:success', model);
      },
      error: function (model, response, options) {
        self.trigger('profile:fetch:error', model, response);
      },
    });
  },

  initializeProfileSave: function () {
    var _this = this;

    this.listenTo(this, 'profile:updateWithPhotoId', function (file) {
      var _self = this;
      var data = {
        photoId: file.id,
      };
      _this.save(data, {
        success: function (data) {
          _this.trigger('profile:updatedPhoto', data);
        },
        error: function (data) {
          // an error occurred
        },
      });
    });

    this.listenTo(this, 'profile:removePhoto', function (file) {
      var _self = this;
      var data = {
        photoId: file.id,
      };
      _this.remove(data, {
        success: function (data) {
          _this.trigger('profile:updatedPhoto', data);
        },
        error: function (data) {
          // an error occurred
        },
      });
    });

    this.listenTo(this, 'profile:save', function (data) {
      _this.save(data, {
        success: function (data) {
          _this.trigger('profile:save:success', data);
        },
        error: function (data) {
          _this.trigger('profile:save:fail', data);
        },
      });
    });

    this.listenTo(this, 'skills:save', function (form) {         
      $.ajax({
        url: this.urlRoot +  '/skills/' + this.id,
        method: 'PUT',
        dataType: 'json',     
        data: {
          id: +this.id,
          username: form.username, 
          tags:JSON.stringify(form.tags)  },        
      }).done(function (data) {     
        _this.trigger('skills:save:success', data);
      }).fail(function (data) {
        _this.trigger('skills:save:fail', data);
      });
    });

    this.listenTo(this, 'profile:removeAuth', function (service) {
      $.ajax({
        url: '/api/auth/disconnect/' + service,
        method: 'POST',
      }).done(function (data) {
        _this.fetch({
          success: function (model) {
            _this.trigger ('profile:removeAuth:success', model, service);
          },
        });
      }).fail(function (data) {
        _this.trigger('profile:removeAuth:fail', data, service);
      });
    });
  },
});

module.exports = ProfileModel;
