/**
* Policy - delete.js
* Can a user delete the object (events,comments,discussions)
* TODO: 
*
*/

var async     = require('async');
var userUtil  = require('./user');
var projUtil  = require('../services/utils/project');
var eventUtil = require('../services/utils/event');


module.exports = function canDeleteEvent (req, res, next) {

	if (req.route.params.id) {
	    var eventId = req.route.params.id;
	    var userId = null;
	    
	    if (req.user) {
	      userId = req.user[0].id;

	      if ( req.user && req.user[0].isAdmin ){
			//is admin ?
			next();
		  } else if ( projUtil.authorized(projectId,userId,projectCb) ) {
			//is project owner ?
			next();
		  } else if ( event.isCreator(objectId,userId) ){
			//is event creator ?
			next();
		  }
		}
	 	
	 	//if we fall through to here something is amiss, so throw 403
 		return res.send(403, { message: 'Not authorized.'});
	}

}