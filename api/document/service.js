const _ = require('lodash');
const log = require('blue-ox')('app:document:service');
const db = require('../../db');
const dao = require('./dao')(db);
const AWS = require('aws-sdk');
const fs = require('fs');
const fileType = require('file-type');
const path = require('path');
const uuid = require('uuid');
const config = openopps.fileStore || {};
const gm = require('gm').subClass({ imageMagick: true });

function store (name, data, cb) {
  var service = config.service || 'local';
  this[service].store.apply(this, arguments);
}

function get (name, cb) {
  var service = (config.service || 'local');
  this[service].get.apply(this, arguments);
}

local = {
  store: function (name, data, cb) {
    var dir = path.join(openopps.appPath, config.local.dirname || 'assets/uploads');
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFile(path.join(dir, name), data, cb);
  },
  get: function (name, cb) {
    var dir = path.join(openopps.appPath, config.local.dirname || 'assets/uploads');
    fs.readFile(path.join(dir, name), (err, data) => {
      if(err) {
        cb(err, null);
      } else {
        cb(null, {
          Body: data,
          ContentType: fileType(data).mime,
        });
      }
    });
  },
};

// S3 operations
s3 = {
  store: function (name, data, cb) {
    var s3 = new AWS.S3();
    var params = {
      Bucket: config.s3.bucket,
      Key: path.join(config.s3.prefix || '', name),
      Body: data,
    };
    s3.upload(params, cb);
  },
  get: function (name, cb) {
    var s3 = new AWS.S3();
    var params = {
      Bucket: config.s3.bucket,
      Key: path.join(config.s3.prefix || '', name),
    };
    s3.getObject(params, cb);
  },
};

function getImageSize (data) {
  return new Promise(function (resolve) {
    gm(data, 'photo.jpg').size(function (err, size) {
      if (err || !size) {
        resolve({ message: 'Error with file: it is probably not an image. ', error: err });
      } else {
        resolve(size);
      }
    });
  });
}

function cropImage (data) {
  return new Promise(async (resolve) => {
    log.info('Making square image...');
    var size = await getImageSize(data);
    if(size.error) {
      resolve(size);
    } else {
      var newCrop = Math.min(size.width, size.height);
      var newSize = Math.min(newCrop, 712);
      gm(data, 'photo.jpg')
        .crop(newCrop, newCrop, ((size.width - newCrop) / 2), ((size.height - newCrop) / 2))
        .resize(newSize, newSize)
        .noProfile()
        .toBuffer(function (err, buffer) {
          if(err) {
            resolve({ message:'Error creating buffer.', error: err });
          } else {
            resolve(buffer);
          }
        });
    }
  });
}

function resizeImage (data) {
  return new Promise(async (resolve) => {
    log.info('Resizing image...');
    var size = await getImageSize(data);
    if(size.error) {
      resolve(size);
    } else {
      var width = (size.height > size.width && size.width > 712) ? 712 : null;
      var height = (size.width > size.height && size.height > 712) ? 712 : null;
      if (!width && !height) {
        width = size.width;
      }
      gm(data, 'photo.jpg')
        .resize(width, height)
        .noProfile()
        .toBuffer(function (err, buffer) {
          if(err) {
            resolve({ message:'Error creating buffer.', error: err });
          } else {
            resolve(buffer);
          }
        });
    }
  });
}

function validType (imageType, fileType) {
  var expectedImageTypes = ['image_square', 'image'];
  var validImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp'];
  if (_.includes(expectedImageTypes, imageType)) {
    return _.includes(validImageTypes, fileType);
  }
  if (fileType == 'exe') {
    sails.log.error('Executable files not allowed');
    return false;
  }
  // we didn't find anything bad so we'll generously accept any other file
  return true;
}

function processFile (type, file) {
  log.info('Processing file => ', file.name);
  return new Promise((resolve) => {
    fs.readFile(file.path, async (err, data) => {
      if(err) {
        log.info('Error reading file ', file.name, err);
        resolve(false);
      } else {
        var imageData = type === 'image_square' ?
          await cropImage(data) : type === 'image' ?
            await resizeImage(data) : data;
        if(data.error) {
          log.info(data.message, data.error);
          resolve(false);
        } else {
          var f = {
            name: file.name,
            mimeType: file.type,
            fd: uuid.v1() + '.' + file.name.split('.').pop(),
            size: imageData.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store(f.fd, imageData, (err, data) => {
            if(err) {
              log.info('Error storing file ', file.name, err);
              resolve(false);
            }
            resolve(f);
          });
        }
      }
    });
  });
}

function findOne (id) {
  return new Promise(async (resolve) => {
    dao.File.findOne('id = ?', id).then(file => {
      get(file.fd, (err, data) => {
        if(err) {
          log.info('Error retrieving file ', file.name, err);
          resolve(false);
        }
        resolve(data);
      });
    }).catch((err) => {
      resolve(false);
    });
  });
}

function upload (userId, data) {
  return Promise.all((data['files[]'] || []).map(async (file) => {
    if(validType(data.type, file.type)) {
      var fdata = await processFile(data.type, file);
      if(fdata) {
        fdata.userId = userId;
        return await dao.File.insert(fdata);
      }
    } else {
      log.info('Invalid file type ', file.type);
    }
  }));
}

async function taskAttachments (taskId) {
  return await dao.Attachment.query(dao.query.attachmentQuery, taskId, dao.options.attachment);
}

module.exports = {
  findOne: findOne,
  upload: upload,
  taskAttachments: taskAttachments,
};
