const crypto = require('crypto');
const _ = require('lodash');

/**
 * @param {string} data encrypted string
 * @param {string} iv initialization vector
 */
const encryptedResult = {
  data: '',
  iv: '',
};

module.exports = {};

/**
 * Wrapper for Crypto.createCipheriv(algorithm, key, iv)
 * 
 * @param {string} data value to encrypt
 * @param {string} key key for encryption (default: openopps.masterKey)
 * 
 * @returns {encryptedResult} encrypted result
 */
module.exports.encrypt = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipherKey = crypto.createHash('sha256').update(key || openopps.masterKey).digest();
  const cipher = crypto.createCipheriv('aes256', cipherKey, iv);
  var encrypted = cipher.update(data);
  return {
    data: Buffer.concat([encrypted, cipher.final()]).toString('hex'),
    iv: iv.toString('hex'),
  };
};

/**
 * Wrapper for Crypto.createDecipheriv(algorithm, key, iv)
 * 
 * @param {string} data value to decrypt
 * @param {string | Buffer} iv initialization vector used during encryption
 * @param {string=} key key used for encryption (default: openopps.masterKey)
 * 
 * @returns {string} decrypted data
 */
module.exports.decrypt = (data, iv, key) => {
  if(!_.isBuffer(iv)) {
    iv = Buffer.from(iv, 'hex');
  }
  const cipherKey = crypto.createHash('sha256').update(key || openopps.masterKey).digest();
  const decipher = crypto.createDecipheriv('aes256', cipherKey, iv);
  var decrypted = decipher.update(Buffer.from(data, 'hex'));
  return Buffer.concat([decrypted, decipher.final()]).toString();
};