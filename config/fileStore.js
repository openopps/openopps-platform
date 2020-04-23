var AWS = require('aws-sdk');
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var s3Creds = appEnv.getServiceCreds('s3-midas-assets');

var FS = {
  service: process.env.FILESTORE || 'local',

  local: {
    dirname: 'assets/uploads',
  },

  /**
   * Store files on AWS S3
   * Useful for multi-server hosting environments
   *
   * Set fileStore.service = 's3'
   *
   * Set credentials according `aws-sdk` instructions:
   * http://v.gd/aws_sdk_creds
   *
   * @bucket: s3 bucket to use
   * @prefix: prefix string / virtual path within bucket
   */

  s3: {
    bucket: process.env.S3_BUCKET || null,
    prefix: process.env.S3_PREFIX || 'uploads',
  },

};

// If running in Cloud Foundry with an S3 credential service available
if (s3Creds) {
  AWS.config.update({
    accessKeyId: s3Creds.access_key_id,
    secretAccessKey: s3Creds.secret_access_key,
    region: s3Creds.region,
  });
  FS.s3.bucket = s3Creds.bucket;
  FS.s3.prefix = 'openopps-uploads';
}

module.exports.fileStore = FS;
