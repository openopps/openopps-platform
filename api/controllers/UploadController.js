/**
 * UploadController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */
var fileType = require('file-type');
var fs = require('fs');
var gm = require('gm');
var _ = require('underscore');
var async = require('async');

// expectedType: image_square or image,
// if not given it is an attachment which could be anything
function validType(expectedType, data) {
  var expectedImageTypes = ['image_square', 'image']
  var validImageTypes = ['png', 'jpg', 'gif', 'bmp']
  var detectedType = fileType(data);
  if (_.contains(expectedImageTypes, expectedType)) {
    if (detectedType && _.contains(validImageTypes, detectedType.ext)) {
      sails.log.info('Valid type detected:', detectedType.ext);
      return true;
    }
    sails.log.error('Invalid image:',
                    detectedType === null ? 'unknown type' : detectedType.ext);
    return false;
  }
  if (detectedType.ext == 'exe') {
    sails.log.error('Executable files not allowed');
    return false;
  }
  // we didn't find anything bad so we'll generously accept any other file
  return true;
}

module.exports = {
  find: function(req, res) {
    // Get requests return the file metadata, post requests store files
    Upload.findOne({ where: { 'id': req.params.id }
                   //groupBy: [ 'id', 'userId', 'name', 'isPrivate', 'mimeType', 'size']
                 }, function (err, file) {
      // XXX TODO: This is a hack until the following issue is resolved:
      // https://github.com/balderdashy/waterline/issues/73
      delete file['data'];
      sails.log.debug('Upload:', file);
      // Make sure the user has access to the file
      res.send(file);
    });
  },

  // Get the contents of a file by id or name
  get: function(req, res) {
    if (!req.params.id) { return res.send(400, {message:'No file id specified.'}); }
    if (_.isFinite(req.params.id)) {
      // a Upload ID has been provided
      Upload.findOneById(req.params.id, function(err, f) {
        if (err) { return res.send(400, {message:'Error while finding file.'}); }
        if (!f || !f.fd) { return res.send(400, {message:'Error while finding file.'}); }
        fileStore.get(f.fd, res);
      });
    } else {
      return res.send(400, {message: 'Abiguous file; please use file id.'});
    }
  },

  create: function(req, res) {
    sails.log.debug('CREATE FILE!');
    // Create only accepts post
    if (req.route.method != 'post') { return res.send(400, {message:'Unsupported operation.'}); }

    var results = [];

    var processFile = function (upload, done) {
      sails.log.verbose('processFile', upload)
      // Read the temporary file
      fs.readFile(upload.fd, function (err, fdata) {
        sails.log.verbose('readFile (err fdata)', err, fdata)
        if (err) sails.log.error('FileController create fs.readFile:', err)
        if (err || !fdata) { return done({message:'Error storing file.'}); }
        if (!validType(req.param('type'), fdata)) {
          return done({message:'Error storing file, invalid file type'});
        }
        
        // Create a file object to put in the database.
        var f = {
          userId: req.user.id,
          name: upload.filename,
          mimeType: upload.type || upload.headers['content-type'],
          fd: upload.fd.split('/').pop(),
          size: fdata.length,
          data: fdata
        };
        // if the type of the file should be a square image
        // resize the image before storing it.
        if (req.param('type') == 'image_square') {
          sails.log.verbose('making square image...')
          gm(f.data, 'photo.jpg')
          .size(function (err, size) {
            sails.log.verbose('gm (err size)', err, size)
            if (err || !size) {
              return done({ message: 'Error with file: it is probably not an image. ', error: err });
            }
            var newCrop = Math.min(size.width, size.height);
            var newSize = Math.min(newCrop, 712);
            gm(f.data, 'photo.jpg')
            .crop(newCrop, newCrop, ((size.width - newCrop) / 2), ((size.height - newCrop) / 2))
            .resize(newSize, newSize)
            .noProfile()
            .toBuffer(function (err, buffer) {
              sails.log.verbose('gm toBuffer (err)', err)
              delete f.data;
              f.size = buffer.length;
              fileStore.store(f.fd, buffer, function(err) {
                sails.log.verbose('fileStore.store (err)', err)
                if (err) { return done({ message:'Error storing file.', error: err }); }
                Upload.create(f, function(err, newFile) {
                  sails.log.verbose('Upload.create (err)', err)
                  if (err || !newFile) { return done({ message:'Error storing file.', error: err }); }
                  delete newFile['data'];
                  results.push(newFile);
                  return done();
                });
              });
            });
          });
        } else if (req.param('type') == 'image') {
          // resize the image so that it isn't massive
          gm(f.data, 'photo.jpg')
          .size(function (err, size) {
            if (err || !size) {
              return done({ message: 'Error with file: it is probably not an image. ', error: err });
            }
            var width = null;
            var height = null;
            // width is longer
            sails.log.debug(size);
            if (size.width > size.height) {
              if (size.height > 712) {
                height = 712;
                sails.log.debug('height');
              }
            }
            // height is longer
            else {
              if (size.width > 712) {
                width = 712;
                sails.log.debug('width');
              }
            }
            if ((width === null) && (height === null)) {
              width = size.width;
            }
            sails.log.debug(width + ' x ' + height);
            gm(f.data, 'photo.jpg')
            .resize(width, height)
            .noProfile()
            .toBuffer(function (err, buffer) {
              delete f.data;
              f.size = buffer.length;
              fileStore.store(f.fd, buffer, function(err) {
                if (err) { return done({ message:'Error storing file.', error: err }); }
                Upload.create(f, function(err, newFile) {
                  if (err || !newFile) { return done({ message:'Error storing file.', error: err }); }
                  delete newFile['data'];
                  results.push(newFile);
                  return done();
                });
              });
            });
          });
        } else {
          fileStore.store(f.fd, f.data, function(err) {
            if (err) { return done({ message:'Error storing file.', error: err }); }
            delete f.data;
            Upload.create(f, function(err, newFile) {
              if (err || !newFile) { return done({ message:'Error storing file.', error: err }); }
              delete newFile['data'];
              results.push(newFile);
              return done();
            });
          });
        }
      });
    };

    req.file('files[]').upload(function(err, uploadedFiles) {
      if (!uploadedFiles || uploadedFiles.length === 0) return res.send(400, {
        message:'Must provide file data.'
      });
      async.each(uploadedFiles, processFile, function (err) {
        if (err) return res.send(400, err);

        res.set('Content-Type', 'text/html');
        // Wrap in HTML so IE8/9 can process it; can't accept json directly
        var wrapper = '<textarea data-type="application/json">';
        wrapper += JSON.stringify(results);
        wrapper += '</textarea>';
        return res.send(wrapper);
      });
    });

  },

};
