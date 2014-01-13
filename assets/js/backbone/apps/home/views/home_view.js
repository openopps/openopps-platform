// define([
//   'jquery',
//   'async',
//   'dropzone',
//   'underscore',
//   'backbone',
//   'utilities',
//   'tag_show_view',
//   'text!profile_show_template',
//   'text!profile_email_template',
//   'text!home_template',
//   'modal_component',
//   'profile_activity_view',
//   'profile_email_view'
// ], function ($, async, dropzone, _, Backbone, utils,
//   TagShowView, ProfileTemplate, EmailTemplate, ModalComponent, PAView, EmailFormView, HomeTemplate) {
// 
//   var HomeView = Backbone.View.extend({
// 
//     initialize: function (options) {
//       this.options = options;
//       this.data = options.data;
//     },
// 
//     render: function () {
//       var template = _.template(HomeTemplate);
//       this.$el.html(template);
//       return this;
//     },
// 
//     cleanup: function () {
//       if (this.tagView) { this.tagView.cleanup(); }
//       if (this.projectView) { this.projectView.cleanup(); }
//       if (this.taskView) { this.taskView.cleanup(); }
//       removeView(this);
//     },
// 
//   });
// 
//   return HomeView;
// });
