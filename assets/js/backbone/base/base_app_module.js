var _ = require('underscore');
var Backbone = require('backbone');


AppModule.BaseAppModule = Backbone.View.extend({
  initialize: function() {},

  initializeControllerSafely: function(appModuleRenderState, controllerToRender) {
    if (appModuleRenderState === true) {
      if (this.controller) {
        this.controller.cleanup();
      } else {
        this.controller = new controllerToRender();
      }
    } else {
      // Can only load controllers within an application module if the appmod rendered safely.
      return;
    }
  }
});

module.exports = AppModule.BaseAppModule;
