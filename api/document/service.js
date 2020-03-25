const _ = require('lodash');
const log = require('log')('app:document:service');
const db = require('../../db/client');
const fileUtils = require('./fileUtils');

module.exports = {};

module.exports.findImage = function (fileId) {
  return new Promise((resolve, reject) => {
    db.query({
      text: 'SELECT * FROM file WHERE "mimeType" like $1 and id = $2',
      values: ['%image/%', fileId],
    }).then(queryResult => {
      var file = queryResult.rows[0];
      if (file) {
        fileUtils.get(file.fd, (err, data) => {
          if(err) {
            log.info('Error retrieving file ', file.name, err);
            reject();
          }
          resolve({ body: data, contentType: file.mimeType });
        });
      } else  {
        log.info('No valid image file for id', fileId);
        reject();
      }
    }).catch(reject);
  });
};

module.exports.findOne = function (fileId) {
  return new Promise(async (resolve) => {
    db.query({
      text: 'SELECT * FROM file WHERE id = $1',
      values: [fileId],
    }).then(queryResult => {
      var file = queryResult.rows[0];
      if (file) {
        fileUtils.get(file.fd, (err, data) => {
          if(err) {
            log.info('Error retrieving file ', file.name, err);
            resolve(false);
          }
          resolve({ body: data, contentType: file.mimeType });
        });
      } else {
        resolve(false);
      }
    }).catch((err) => {
      resolve(false);
    });
  });
};

module.exports.removeFile = function (fileId) {
  return new Promise(resolve => {
    db.query({
      text: 'SELECT * FROM file WHERE id = $1',
      values: [fileId],
    }).then(queryResult => {
      var file = queryResult.rows[0];
      if (file) {
        fileUtils.remove(file.fd, (err, data) => {
          if(err) {
            log.info('Error removing file ', file.name, err);
            resolve(false);
          }
          db.query({
            text: 'DELETE FROM file WHERE id = ? RETURNING *',
            values: [fileId],
          }).then(() => {
            resolve(true);
          }).catch(() => {
            resolve(true);
          });
        });
      } else {
        resolve(false);
      }
    }).catch((err) => {
      resolve(false);
    });
  });
};

module.exports.taskAttachments = function (taskId) {
  return new Promise((resolve, reject) => {
    db.query({
      text: `SELECT
              attachment.*,
              (
                SELECT ROW_TO_JSON(file)
                FROM file WHERE id = attachment."fileId"
              ) as file
            FROM attachment WHERE attachment."taskId" = $1`,
      values: [taskId],
    }).then(queryResult => {
      resolve(queryResult.rows);
    }).catch(reject);
  });
};

module.exports.upload = function (userId, data) {
  return Promise.all((data['files[]'] || []).map((file) => {
    if(fileUtils.validType(data.type, file.type)) {
      return new Promise((resolve, reject) => {
        fileUtils.processFile(data.type, file).then(fdata => {
          if(fdata) {
            db.query({
              text: `INSERT INTO file ("userId", name, "mimeType", size, "createdAt", "updatedAt", fd)
                    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
              values: [userId, fdata.name, fdata.mimeType, fdata.size, new Date(), new Date(), fdata.fd],
            }).then(queryResult => {
              resolve(queryResult.rows[0]);
            }).catch(err => {
              log.info('Error uploading file', err);
              reject('An unexpected error occured trying to process your upload.');
            });
          }
        }).catch(reject);
      });
    } else {
      log.info('Invalid file type ', file.type);
      throw Error('Invalid file type. You may only upload png, jpg, jpeg, gif or bmp image files.');
    }
  }));
};
