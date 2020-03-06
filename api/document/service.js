const _ = require('lodash');
const log = require('log')('app:document:service');
const db = require('../../db');
const dao = require('./dao')(db);
const fileUtils = require('./fileUtils');

function findOne (id) {
  return new Promise(async (resolve) => {
    dao.File.findOne('id = ?', id).then(file => {
      fileUtils.get(file.fd, (err, data) => {
        if(err) {
          log.info('Error retrieving file ', file.name, err);
          resolve(false);
        }
        resolve({ Body: data, ContentType: file.mimeType });
      });
    }).catch((err) => {
      resolve(false);
    });
  });
}

function removeFile (id) {
  return new Promise(async (resolve) => {
    dao.File.findOne('id = ?', id).then(file => {
      fileUtils.remove(file.fd, async (err, data) => {
        if(err) {
          log.info('Error removing file ', file.name, err);
          resolve(false);
        }
        await dao.File.delete(file);
        resolve(true);
      });
    }).catch((err) => {
      resolve(false);
    });
  });
}

function upload (userId, data) {
  return Promise.all((data['files[]'] || []).map(async (file) => {
    if(fileUtils.validType(data.type, file.type)) {
      var fdata = await fileUtils.processFile(data.type, file);
      if(fdata) {
        fdata.userId = userId;
        return await dao.File.insert(fdata);
      }
    } else {
      log.info('Invalid file type ', file.type);
      throw Error('Invalid file type. You may only upload png, jpg, jpeg, gif or bmp image files.');
    }
  }));
}

async function taskAttachments (taskId) {
  return await dao.Attachment.query(dao.query.attachmentQuery, taskId, dao.options.attachment);
}

module.exports = {
  findOne: findOne,
  upload: upload,
  removeFile: removeFile,
  taskAttachments: taskAttachments,
};
