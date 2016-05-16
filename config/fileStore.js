var AWS = require('aws-sdk'),
    cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv(),
    s3Creds = appEnv.getServiceCreds('s3-midas-assets');

// If running in Cloud Foundry with an S3 credential service available
if (s3Creds) {
  AWS.config.update({
    accessKeyId: s3Creds.access_key_id,
    secretAccessKey: s3Creds.secret_access_key
  });
  process.env.S3_BUCKET = s3Creds.bucket;
  process.env.S3_PREFIX = 'openopps-uploads';
}


module.exports.fileStore = {
  service: process.env.FILESTORE || 'local',

  local: {
    dirname: 'assets/uploads'
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
    bucket: process.env.S3_BUCKET || 'midas-filestore',
    prefix: process.env.S3_PREFIX || 'assets/uploads'
  }

};
