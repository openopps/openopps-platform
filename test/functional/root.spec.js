const common = require('./common.js');
const request = common.request;

describe('Root site tests', () => {
  it('get / has content and headers', function () {
    return request
      .get('/')
      .then(function (res) {
        res.should.have.header('Content-Type', 'text/html; charset=utf-8');
        res.should.have.header('Content-Encoding', 'gzip');
        res.should.have.header('Strict-Transport-Security', 'max-age=31536000');
        res.should.have.header('X-Content-Type-Options', 'nosniff');
        res.should.have.header('X-Frame-Options', 'SAMEORIGIN');
        res.should.have.header('X-XSS-Protection', '1; mode=block');
        res.should.have.status(200);
        res.text.should.have.string('Open Opportunities');
      });
  });
  it('has favicon.ico', function () {
    return request
      .get('/favicon.ico')
      .then(function (res) {
        res.body.length.should.equal(1150);
        res.should.have.status(200);
      });
  });
  it('has css', function () {
    return request
      .get('/min/production.min.css')
      .then(function (res) {
        res.should.have.header('Content-Type', 'text/css; charset=UTF-8');
        res.should.have.header('Cache-Control', 'public, max-age=31536000');
        res.res.client.bytesRead.should.be.below(40000);
      });
  });
  it('has javascript', function () {
    return request
      .get('js/bundle.js')
      .then(function (res) {
        res.should.have.header('Content-Type', 'application/javascript');
        res.should.have.header('Cache-Control', 'public, max-age=31536000');
        res.res.client.bytesRead.should.be.below(600000);
      });
  });
  it('has font', function () {
    return request
      .get('/fonts/sourcesanspro-light-webfont.woff2 ')
      .then(function (res) {
        res.should.have.header('Content-Type', 'application/font-woff2');
        res.should.have.header('Cache-Control', 'public, max-age=31536000');
        res.res.client.bytesRead.should.be.below(24000);
      });
  });
  it('has image', function () {
    return request
      .get('/images/logo@2x.png')
      .then(function (res) {
        res.should.have.header('Content-Type', 'image/png');
        res.should.have.header('Cache-Control', 'public, max-age=31536000');
        res.should.have.header('Content-Length','19633');
        res.res.client.bytesRead.should.be.below(21000);
      });
  });
});
