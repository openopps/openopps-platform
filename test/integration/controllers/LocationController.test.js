var assert = require('chai').assert;
var request = require('supertest');
replay  = require('replay');
replay.fixtures = 'test/fixtures';

// this uses replay module which stores data in /fixtures
// if the geonames API ever changes or to create new test cases
// record with:  REPLAY=record npm test -- --grep LocationCo
// useful debuggin: DEBUG=replay npm test -- --grep LocationCo
describe('LocationController', function() {

  describe('api/location/suggest', function() {
    var san_locations = require('../../fixtures/locations-san.js');

    var containsSanLocations = function(res) {
      // testing no change in behavior from 0.9.4
      // but "San" shouldn't really match "Honolulu, Hawaii"
      assert.deepEqual(res.body, san_locations);
    }
    it('query location', function (done) {
      request(sails.hooks.http.app)
        .get('/api/location/suggest?q=San')
        .expect(200)
        .expect(containsSanLocations)
        .end(done)
    });
  });
});
