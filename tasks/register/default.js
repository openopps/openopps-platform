/**
 * `default`
 *
 * ---------------------------------------------------------------
 *
 * This is the default Grunt tasklist that will be executed if you
 * run `grunt` in the top level directory of your app.  It is also
 * called automatically when you start Sails in development mode using
 * `sails lift` or `node app`.
 *
 * Note that when lifting your app in a production environment (with the
 * `NODE_ENV` environment variable set to 'production') the `prod` task
 * will be run instead of this one.
 *
 * For more information see:
 *   http://sailsjs.org/documentation/anatomy/my-app/tasks/register/default-js
 *
 */
module.exports = function (grunt) {
  grunt.registerTask('default', ['compileAssets', 'linkAssets',  'watch']);
};
