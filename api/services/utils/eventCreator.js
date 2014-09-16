var async = require('async');
var userUtil = require('./user');

/**
* Determine if the req.user is the userId associated with the comment or event
* This would make them the "creator" creator and grant them the ability to delete it
 */


var isEventCreator = function (objId, userId, cb){
  Event.findOneById(objId,function(err, event){
    if (err) { return cb('Error looking up event creator.', null); }
      if (event.userId == userId) { event.isCreator = true; } else { event.isCreator = false; }
      return cb(null,event); 
  });



};

module.exports = {
  isEventCreator: isEventCreator,
};
