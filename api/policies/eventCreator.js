/**
* Get the project referenced in :id and check if access is allowed
*/
var util = require('../services/utils/eventCreator')

module.exports = function eventCreator (req, res, next) {
  if (req.route.params.id) {
    var userId = null;
    if (req.user) {
      userId = req.user[0].id;
    }
    util.isEventCreator(req.route.params.id, userId, function (err, event) {
      if (err) { return res.send({ message: err }); }
      if (!err && !event.isCreator) { 
        return res.send(403, { message: 'Not authorized.'}); 
      } else if (event.isCreator){
        next();  
      }
    });
  // no :id is specified, so throw 403
  } else {
    return res.send(403, { message: 'Not authorized.'}); 
  }
};
