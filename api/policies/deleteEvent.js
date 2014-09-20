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
		Event.findOneById(req.route.params.id,function(err, event){ 

			if (user) {	
			ProjectOwner.find()
				.where({ "projectId": event.projectId })
				.exec(function(err,projOwners) {
				
				var poList = [];	
				
				_.each(projOwners,function(projO){
					poList.push(projO.userId);
				});
				
				if ( user.isAdmin ){
					//is admin ?
					next();
				  } else if ( projOwners && (_.indexOf(poList,user.id) != -1) ) {
					//is project owner ?
					next();
				  } else if ( event.userId == userId ) {
					//is event creator ?
					next();
				  } else {
				  	return res.send(403, { message: 'Not authorized.'});
				  }
				});	      
			} else {
				return res.send(403, { message: 'Not authorized.'});
			}
		});
	  
	} else {
		//if we fall through to here something is amiss, so throw 403
		return res.send(403, { message: 'Not authorized.'});
	}
}
