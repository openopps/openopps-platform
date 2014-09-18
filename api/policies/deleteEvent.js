/**
* Policy - delete.js
* Can a user delete the object (events,comments,discussions)
* TODO: 
*
*/

var async     = require('async');
var userUtil  = require('./user');
var projUtil  = require('../services/utils/project');

module.exports = function deleteEvent (req, res, next) {
	var user = req.user[0];

	if (req.route.params.id) {
		Event.findOneById(eventId,function(err, event){ 

			if (user) {	
			
			ProjectOwner.findOne()
				.where({ "projectId": event.projectId })
				.exec(function(err,projOwners) {
				console.log("proj owners", projOwners.userId,user);

				if ( user.isAdmin ){
			      	console.log("passed as admin");
					//is admin ?
					next();
				  } else if ( projOwners && projOwners.userId == user.id ) {
				  	console.log("passed as project owner");
					//is project owner ?
					next();
				  } else if ( event.userId == userId ) {
				  	console.log("passed as event creator");
					//is event creator ?
					next();
				  } else {
					console.log("failed");
				  	return res.send(403, { message: 'Not authorized.'});
				  }
				});	      
			} else {
				console.log("user is undefined",user);
			}
		});
	  
	} else {
		//if we fall through to here something is amiss, so throw 403
		return res.send(403, { message: 'Not authorized.'});
	}
}
