var assert = require('chai').assert;
var request = require('supertest');

describe('AcController', function() {

// https://openopps-test.18f.gov/api/ac/tag?type=agency&q=GS&_=1459872051200

  describe('api/ac/tag', function() {
    var isEmptyArray = function(res) {
      assert.deepEqual(res.body,[])
    }

    it('with zero tags, returns empty array', function (done) {
      request(sails.hooks.http.app)
        .get('/api/ac/tag')
        .expect(200)
        .expect(isEmptyArray)
        .end(done)
    });

    describe('with some tags', function() {
      beforeEach(function(done) {
        var tags = require('../../fixtures/tags');
        TagEntity.create(tags).exec( function ( err, records ) {
          done();
        });
      });
      it('can query by type and name', function(done) {
        request(sails.hooks.http.app)
          .get('/api/ac/tag?type=agency&q=Devel')
          .expect(200)
          .expect(function(res) {
            assert.deepEqual(res.body,
              [
                {
                  field: "name",
                  id: 8,
                  name: "Agency for International Development (USAID)",
                  target: "tagentity",
                  type: "agency",
                  value: "Agency for International Development (USAID)"
                },
                {
                  field: "name",
                  id: 14,
                  name: "Department of Housing and Urban Development (HUD)",
                  target: "tagentity",
                  type: "agency",
                  value: "Department of Housing and Urban Development (HUD)"
                }
              ]
            )
          })
          .end(done)
      });

    });

  });


});
