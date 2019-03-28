const crypto = require('crypto');

module.exports = {
  Hmac: function (p1) {
    var hash = crypto.createHmac('sha256', Buffer.from(openopps.auth.documentSecret, 'utf8')).update(p1).digest('base64');
    return hash.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  },
};