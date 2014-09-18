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


module.exports = function deleteEvent (req, res, next) {

	if (req.route.params.id) {
	    var eventId = req.route.params.id;
	    var userId = null;
	    data = {};

		Event.findOneById(eventId,function(err, event){ 
			if (req.user) {
		      userId = req.user[0].id;
		      if ( req.user && req.user[0].isAdmin ){
				//is admin ?
				next();
			  } else if ( projUtil.authorized(event.projectId,userId,projectCb) ) {
				//is project owner ?
				next();
			  } else if ( eventUtil.isCreator(eventId,userId) ) {
				//is event creator ?
				next();
			  } else {
			  	return res.send(403, { message: 'Not authorized.'});
			  }
			}
		});
	  
	} else {
		//if we fall through to here something is amiss, so throw 403
		return res.send(403, { message: 'Not authorized.'});
	}
}
