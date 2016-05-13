var Sails = require('sails'),
    async = require('async');

Sails.lift({}, function(err, sails) {
  if (err) return console.error(err);

  Upload.find({}).exec(function(err, files) {
    if (err) return console.error(err);
    async.each(files, moveFile, function(err) {
      if (err) sails.log.error(err);
      Sails.lower();
    });
  });

  function moveFile(file, cb) {
    if (file.fd || !file.data) return cb();
    var fd = file.id + '.' + file.name.split('.').pop();
    fileStore.store(fd, file.data.parent, function(err, message) {
      if (err) sails.log.error(err);
      Upload.update(file.id, { fd: fd }).exec(function(err) {
        if (err) sails.log.error(err);
        cb();
      });
    });
  }

});
