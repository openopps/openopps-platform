require.config({
  waitSeconds: 200,

  paths: {

    // ----------
    //= Vendor
    // ----------
    'jquery'                    : '../../vendor/jquery',
    'text'                      : '../../vendor/text',
    'json'                      : '../../vendor/requirejs-plugins/src/json',
    'moment'                    : '../../vendor/moment/moment',
    'jquery_timeago'            : '../../vendor/jquery.timeago',
    'jquery_select2'            : '../../vendor/select2/select2',
    'jquery_timepicker'         : '../../vendor/jquery-timepicker/jquery.timepicker',
    'jquery_dotdotdot'          : '../../vendor/jquery-dotdotdot/src/js/jquery.dotdotdot',
    'jquery_iframe'             : '../../vendor/jquery-file-upload/js/jquery.iframe-transport',
    'jquery.ui.widget'          : '../../vendor/jquery-file-upload/js/vendor/jquery.ui.widget',
    'jquery_fileupload'         : '../../vendor/jquery-file-upload/js/jquery.fileupload',
    'jquery.selection'          : '../../vendor/jquery-selection/src/jquery.selection',
    'jquery.caret'              : '../../vendor/jquery-caret/src/jquery.caret',
    'jquery.at'                 : '../../vendor/jquery-at/dist/js/jquery.atwho',
    'underscore'                : '../../vendor/underscore',
    'backbone'                  : '../../vendor/backbone',
    'bootstrap'                 : '../../vendor/bootstrap',
    'bootstrap-datetimepicker'  : '../../vendor/bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min',
    'async'                     : '../../vendor/async/lib/async',
    'marked'                    : '../../vendor/marked/lib/marked',
    'autolinker'                : '../../vendor/autolinker/dist/Autolinker',
    'i18n'                      : '../../vendor/i18next/i18next.amd.withJQuery',

    // ---------
    // Internationalization configuration for the client side.
    // ---------
    'i18n_config'               : '../config/i18n.json',

    // ---------
    //= Mixins
    // ---------
    'utilities'                 : '../../backbone/mixins/utilities',
    'popovers'                  : '../../backbone/mixins/popovers',
    'popover_profile'           : '../../backbone/mixins/templates/popover_profile.html',

    // ---------
    //= Core App
    // ---------
    'app'                       : '../app',
    'app-run'                   : '../app-run',

    // ---------
    //= Multi-tenant Router
    // ---------
    'apps_router'               : '../../backbone/apps/apps_router',

    // ----------
    //= Base Objects
    // ----------
    'base_controller'           : '../base/base_controller',
    'base_app_module'           : '../base/base_app_module',
    'base_component'            : '../base/base_component',
    'base_view'                 : '../base/base_view',

    // ----------
    //= UI Config
    // ----------
    'ui_config'              : '../config/ui.json',

    // ----------
    //= Navigation
    // ----------
    'nav_view'                  : '../apps/nav/views/nav_view',
    'nav_template'              : '../apps/nav/templates/nav_template.html',

    // ----------
    //= Footer
    // ----------
    'footer_view'               : '../apps/footer/views/footer_view',
    'footer_template'           : '../apps/footer/templates/footer_template.html',

    // ----------
    //= Login
    // ----------
    'login_config'              : '../config/login.json',
    'login_view'                : '../apps/login/views/login_view',
    'login_password_view'       : '../apps/login/views/login_password_view',
    'login_template'            : '../apps/login/templates/login_template.html',
    'login_password_template'   : '../apps/login/templates/login_password_template.html',
    'login_controller'          : '../apps/login/controllers/login_controller',

    // ----------
    //= Home
    // ----------
    'home_controller'           : '../apps/home/controllers/home_controller',
    'home_view'                 : '../apps/home/views/home_view',
    'home_template'             : '../apps/home/templates/home_view_template.html',

    // ----------
    //= Browse
    // ----------
    'browse_app'                : '../apps/browse/browse_app',
    'browse_list_controller'    : '../apps/browse/controllers/browse_list_controller',
    'browse_main_view'          : '../apps/browse/views/browse_main_view',
    'browse_list_view'          : '../apps/browse/views/browse_list_view',
    'browse_main_template'      : '../apps/browse/templates/browse_main_view_template.html',
    'browse_search_tag'         : '../apps/browse/templates/browse_search_tag.html',
    'project_list_item'         : '../apps/browse/templates/project_list_item.html',
    'task_list_item'            : '../apps/browse/templates/task_list_item.html',

    // ----------
    //= Projects
    // ----------
    'project_show_controller'       : '../apps/project/show/controllers/project_show_controller',
    'project_item_view'             : '../apps/project/show/views/project_item_view',
    'project_item_coremeta_view'    : '../apps/project/show/views/project_item_coremeta_view',
    'projectowner_show_view'        : '../apps/projectowner/show/views/projectowner_show_view',
    'projectowner_show_template'    : '../apps/projectowner/show/templates/projectowner_show_template.html',
    'project_show_template'         : '../apps/project/show/templates/project_item_view_template.html',
    'project_model'                 : '../entities/projects/project_model',
    'project_collection'            : '../entities/projects/projects_collection',
    'project_form_view'             : '../apps/project/new/views/project_new_form_view',
    'project_form_template'         : '../apps/project/new/templates/project_new_form_template.html',
    'project_item_coremeta_template': '../apps/project/show/templates/project_item_coremeta_template.html',
    'project_edit_form_template'    : '../apps/project/edit/templates/project_edit_form_template.html',
    'project_edit_form_view'        : '../apps/project/edit/views/project_edit_form_view',

    // ----------
    //= Tags
    // ----------
    'tag_config'                : '../config/tag',
    'tag_show_view'             : '../apps/tag/show/views/tag_show_view',
    'tag_show_template'         : '../apps/tag/show/templates/tag_show_template.html',
    'tag_item_template'         : '../apps/tag/show/templates/tag_item_template.html',
    'tag_form_view'             : '../apps/tag/new/views/tag_new_form_view',
    'tag_form_template'         : '../apps/tag/new/templates/tag_new_form_template.html',

    // ----------
    //= Tasks
    // ----------
    'task_list_template'        : '../apps/tasks/list/templates/task_collection_view_template.html',
    'task_form_template'        : '../apps/tasks/new/templates/task_form_template.html',
    'tasks_collection'          : '../entities/tasks/tasks_collection',
    'task_model'                : '../entities/tasks/task_model',
    'task_list_controller'      : '../apps/tasks/list/controllers/task_list_controller',
    'task_collection_view'      : '../apps/tasks/list/views/task_collection_view',
    'task_form_view'            : '../apps/tasks/new/views/task_form_view',
    'task_item_view'            : '../apps/tasks/show/views/task_item_view',
    'task_show_template'        : '../apps/tasks/show/templates/task_show_item_template.html',
    'task_show_controller'      : '../apps/tasks/show/controllers/task_show_controller',
    'task_edit_form_view'       : '../apps/tasks/edit/views/task_edit_form_view',
    'task_edit_form_template'   : '../apps/tasks/edit/templates/task_edit_form_template.html',
    'volunteer_supervisor_notify_template' : '../apps/tasks/show/templates/volunteer_supervisor_notify_template.html',
    'volunteer_text_template'   : '../apps/tasks/show/templates/volunteer_text_template.html',
    'change_state_template'     : '../apps/tasks/show/templates/change_state_template.html',

    // ----------
    //= Events
    // ----------
    'event_list_template'        : '../apps/events/list/templates/event_collection_view_template.html',
    'event_form_template'        : '../apps/events/new/templates/event_form_template.html',
    'events_collection'          : '../entities/events/events_collection',
    'event_model'                : '../entities/events/event_model',
    'event_list_controller'      : '../apps/events/list/controllers/event_list_controller',
    'event_collection_view'      : '../apps/events/list/views/event_collection_view',
    'event_form_view'            : '../apps/events/new/views/event_form_view',

    // ----------
    //= Attachments
    // ----------
    'attachment_show_view'      : '../apps/attachment/views/attachment_show_view',
    'attachment_show_template'  : '../apps/attachment/templates/attachment_show_template.html',
    'attachment_item_template'  : '../apps/attachment/templates/attachment_item_template.html',

    // ----------
    //= Profile
    // ----------
    'profile_model'             : '../entities/profiles/profile_model',
    'profile_show_view'         : '../apps/profiles/show/views/profile_show_view',
    'profile_show_controller'   : '../apps/profiles/show/controllers/profile_show_controller',
    'profile_show_template'     : '../apps/profiles/show/templates/profile_show_template.html',
    'profile_settings_view'     : '../apps/profiles/show/views/profile_settings_view',
    'profile_settings_template' : '../apps/profiles/show/templates/profile_settings_template.html',
    'profile_reset_view'        : '../apps/profiles/show/views/profile_reset_view',
    'profile_reset_template'    : '../apps/profiles/show/templates/profile_reset_template.html',
    'profile_email_template'    : '../apps/profiles/show/templates/profile_email_template.html',
    'profile_email_view'        : '../apps/profiles/email/views/profile_email_view',
    'profile_email_form_template': '../apps/profiles/email/templates/profile_email_form.html',
    'profile_activity_template' : '../apps/profiles/show/templates/profile_activity_template.html',
    'profile_activity_view'     : '../apps/profiles/show/views/profile_activity_view',

    // ----------
    //= Comments
    // ----------
    'comment_list_controller'   : '../apps/comments/list/controllers/comment_list_controller',
    'comment_item_template'     : '../apps/comments/list/templates/comment_item_template.html',
    'comment_wrapper_template'  : '../apps/comments/list/templates/comment_wrapper_template.html',
    'comment_list_view'         : '../apps/comments/list/views/comment_list_view',
    'comment_collection'        : '../entities/comments/comment_collection',
    'comment_model'             : '../entities/comments/comment_model',
    'comment_form_view'         : '../apps/comments/new/views/comment_form_view',
    'comment_form_template'     : '../apps/comments/new/templates/comment_form_template.html',
    'comment_ac_template'       : '../apps/comments/new/templates/comment_ac_template.html',
    'comment_inline_template'   : '../apps/comments/new/templates/comment_inline_template.html',
    'comment_item_view'         : '../apps/comments/list/views/comment_item_view',

    // ----------
    //= Admin
    // ----------
    'admin_main_controller'     : '../apps/admin/controllers/admin_main_controller',
    'admin_main_view'           : '../apps/admin/views/admin_main_view',
    'admin_main_template'       : '../apps/admin/templates/admin_main_template.html',
    'admin_user_view'           : '../apps/admin/views/admin_user_view',
    'admin_user_password_view'  : '../apps/admin/views/admin_user_password_view',
    'admin_user_template'       : '../apps/admin/templates/admin_user_template.html',
    'admin_user_table'          : '../apps/admin/templates/admin_user_table.html',
    'admin_user_password_template' : '../apps/admin/templates/admin_user_password.html',
    'admin_tag_view'            : '../apps/admin/views/admin_tag_view',
    'admin_tag_template'        : '../apps/admin/templates/admin_tag_template.html',
    'admin_paginate'            : '../apps/admin/templates/admin_paginate.html',
    'admin_dashboard_view'      : '../apps/admin/views/admin_dashboard_view',
    'admin_dashboard_template'  : '../apps/admin/templates/admin_dashboard_template.html',
    'admin_dashboard_table'     : '../apps/admin/templates/admin_dashboard_table.html',

    // ----------
    //= Components
    // ----------
    'modal_component'           : '../components/modal',
    'modal_template'            : '../components/modal_template.html',
    'modal_alert'               : '../components/modal_alert',
    'modal_alert_template'      : '../components/modal_alert_template.html',
    'modal_wizard_component'    : '../components/modal_wizard',
    'modal_wizard_template'     : '../components/modal_wizard_template.html',
    'alert_template'            : '../components/alert_template.html',
    'markdown_editor'           : '../components/markdown_editor',
    'markdown_editor_template'  : '../components/markdown_editor_template.html',
    'autocomplete'              : '../mixins/autocomplete',
    'tag_factory'               : '../components/tag_factory'
  },

  shim: {
    // Select2 is not an AMD module
    'jquery_select2': {
      deps: ['jquery'],
      exports: 'select2'
    },
    'autolinker': {
      exports: 'Autolinker'
    }
  }

});

// moment needs to be initialized or plugins will throw an error
define(["moment"], function (moment) {
    moment().format();
});
