const common = require('../../common.js');
const request = common.request;
const chaiSubset = require('chai-subset');
common.chai.use(chaiSubset);

var expectedTask = {
  'tags': (whatever) => whatever,
  'owner': {
    'id': (whatever) => whatever,
    'name': (whatever) => whatever,
  },
  'state': (whatever) => whatever,
  'projectId': (whatever) => whatever,
  'title': (whatever) => whatever,
  'description': (whatever) => whatever,
  'completedBy': (whatever) => whatever,
  'publishedAt': (whatever) => whatever,
  'assignedAt': (whatever) => whatever,
  'completedAt': (whatever) => whatever,
  'submittedAt': (whatever) => whatever,
  'restrict': (whatever) => whatever,
  'id': (whatever) => whatever,
  'createdAt': (whatever) => whatever,
  'updatedAt': (whatever) => whatever,
};

var expectedTag = {
  'type': (whatever) => whatever,
  'name': (whatever) => whatever,
  'data': (whatever) => whatever,
  'id': (whatever) => whatever,
  'createdAt': (whatever) => whatever,
  'updatedAt': (whatever) => whatever,
};

describe('task api', () => {
  it('get api/tasks has content and headers', function () {
    return request
      .get('/api/task')
      .then(function (res) {
        res.should.have.header('Content-Type', 'application/json; charset=utf-8');
        //res.should.have.header('Content-Encoding', 'gzip');
        //res.body.should.containSubset(expected)
        res.should.have.header('Strict-Transport-Security', 'max-age=31536000');
        res.should.have.header('X-Content-Type-Options', 'nosniff');
        res.should.have.header('X-Frame-Options', 'SAMEORIGIN');
        res.should.have.header('X-XSS-Protection', '1; mode=block');
        res.body.should.have.pro
        res.should.have.status(201);
      });
  });
});
