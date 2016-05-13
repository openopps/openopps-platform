/**
 * MainController
 *
 * @description :: Server-side logic for managing Mains
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  index: function(req, res) {
    // include data variables for the view passed by the policies
    var flash = req.flash('message');
    var data = {
      systemName: sails.config.systemName,
      draftAdminOnly: sails.config.draftAdminOnly || false,
      alert: req.alert || (flash.length) ? { message: flash[0] } : null || null,
      user: (req.user) ? _(req.user).mapValues(function(value) {
        return (typeof value === 'string') ? _.escape(value) : value;
      }).omit('inspect').value() : null
    };
    // get version information
    data.version = sails.config.version;
    // set cache headers to refresh every hour
    res.set('Cache-Control', 'no-transform,public,max-age=3600,s-maxage=3600'); // HTTP 1.1.
    // Hack for this issue: https://github.com/balderdashy/sails/issues/2094
    if (!res.view) return res.send(200);
    res.locals.layout = "main-layout";
    res.view(data);
  },

	 cron: function(req, res) {
		 if (req.param('token') !== sails.config.cron_token) return res.send(400, 'No token');
		 res.send(200);

		 // Check for near due tasks
		 Task.sendNotifications(7);

		 // Check for due tasks
		 Task.sendNotifications();

	 }

};
