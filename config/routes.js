/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': {
    controller: 'main',
    action: 'index'
  },
  '/dashboard': {
    controller: 'main',
    action: 'index'
  },

  // These routes are for backbone push state to work
  '/tasks': {
    controller: 'main',
    action: 'index'
  },
  '/tasks/new': {
    controller: 'main',
    action: 'index'
  },
  '/tasks/:unknownRoute': {
    controller: 'main',
    action: 'index'
  },
  '/tasks/:id/:unknownRoute': {
    controller: 'main',
    action: 'index'
  },
  '/profile': {
    controller: 'main',
    action: 'index'
  },
  '/profile/:id/:unknownRoute': {
    controller: 'main',
    action: 'index'
  },
  '/profile/:unknownRoute': {
    controller: 'main',
    action: 'index'
  },
  '/profiles': {
    controller: 'main',
    action: 'index'
  },
  '/admin': {
    controller: 'main',
    action: 'index'
  },
  '/admin/:unknownRoute': {
    controller: 'main',
    action: 'index'
  },
  '/admin/agencies/:id': {
    controller: 'main',
    action: 'index'
  },
  '/admin/users/:id': {
    controller: 'main',
    action: 'index'
  },
  '/admin/tasks/:id': {
    controller: 'main',
    action: 'index'
  },

  // '/cron': {
  //   controller: 'main',
  //   action: 'cron'
  // },

  '/index.html': '/',

  // Authentication routes
  'get /api/auth/logout': 'AuthController.logout',

  'post /api/auth/local': 'AuthController.callback',

  // for register, and...?
  'post /api/auth/local/:action': 'AuthController.callback',

  'post /api/auth/forgot': 'AuthController.forgot',
  'post /api/auth/disconnect/:provider': 'AuthController.disconnect',
  'get /api/auth/checkToken/:token': 'AuthController.checkToken',

  'get /api/auth/:provider': 'AuthController.provider',
  'get /api/auth/callback/:provider': 'AuthController.callback',
  'get /api/auth/:provider/:action': 'AuthController.callback'


  /***************************************************************************
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
