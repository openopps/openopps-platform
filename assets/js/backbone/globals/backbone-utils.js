var $ = require('jquery');
var Backbone = require('backbone');

Backbone.history.on('all', function (route, router) {
  window.scrollTo(0, 0);
});

/**
 * Helper function to navigate links within backbone
 * instead of reloading the whole page through a hard link.
 * Typically used with the `events: {}` handler of backbone
 * such as 'click .link-backbone' : linkBackbone
 * @param {Event} e the event fired by jquery/backbone
 */
global.linkBackbone = function (e) {
  // if meta or control is held, or if the middle mouse button is pressed,
  // let the link process normally.
  // eg: open a new tab or window based on the browser prefs
  if ((e.metaKey === true) || (e.ctrlKey === true) || (e.which == 2)) {
    return;
  }
  // otherwise contain the link within backbone
  if (e.preventDefault) e.preventDefault();
  var href = $(e.currentTarget).attr('href');
  Backbone.history.navigate(href, { trigger: true });
};

/**
 * Completely remove a backbone view and all of its
 * references.  This is needed to destroy the view
 * and all of its listeners, in order to start
 * fresh again and render a new view with a new
 * model.
 *
 * @param {Backbone.View} view the view to be removed, typically called with removeView(this);
 */
global.removeView = function (view) {
  view.undelegateEvents();
  view.$el.html('');
};