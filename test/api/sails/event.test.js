var assert = require('chai').assert;
var _ = require('underscore');
var icalendar = require('icalendar');
var conf = require('./helpers/config');
var utils = require('./helpers/utils');
var request;

describe('event:', function() {

  var publicProject, draftProject;

  var confirmedEvent, draftEvent;

  before(function(done) {
    request = utils.init();
    utils.login(request, function(err) {
      if (err) { return done(err); }
      utils.createProject(request, true, function(err, proj) {
        if (err) { return done(err); }
        publicProject = proj;
        utils.createProject(request, false, function(err, proj) {
          draftProject = proj;
          done(err);
        });
      });
    });
  });

  describe('logged in:', function () {

    var testEvent = {
      title: 'Test Event',
      description: 'Test Description',
      start: new Date(),
      location: 'San Francisco, CA',
    }

    before(function (done) {
      testEvent.end = new Date(testEvent.start);
      testEvent.start.setHours(testEvent.start.getHours() + 1);
      testEvent.end.setHours(testEvent.end.getHours() + 2);
      request = utils.init();
      utils.login(request, function (err) {
        done(err);
      });
    });

    it('create', function (done) {
      testEvent.projectId = publicProject.id;
      request.post({ url: conf.url + '/event',
                     body: JSON.stringify(testEvent)
                   }, function (err, response, body) {
        if (err) { return done(err); }
        //!!! TODO: This SHOULD be 201, but is broken in Sails .10 https://github.com/balderdashy/sails/issues/1840
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        // check that the values passed in are the same as those passed back
        assert.equal(testEvent.title, b.title);
        assert.equal(testEvent.description, b.description);
        assert.equal(testEvent.location, b.location);
        assert.equal(testEvent.projectId, b.projectId);
        // make sure the automatically populated fields get set
        assert(b.id);
        assert(b.userId);
        assert(b.uuid);
        assert(b.status);
        confirmedEvent = b;
        done();
      });
    });

    it('create unique uuid', function (done) {
      testEvent.projectId = publicProject.id;
      request.post({ url: conf.url + '/event',
                     body: JSON.stringify(testEvent)
                   }, function(err, response, body) {
        if (err) { return done(err); }
        //!!! TODO: This SHOULD be 201, but is broken in Sails .10 https://github.com/balderdashy/sails/issues/1840
        assert.equal(response.statusCode, 200);
        var p1 = JSON.parse(body);
        request.post({ url: conf.url + '/event',
                       body: JSON.stringify(testEvent)
                     }, function (err, response, body) {
          if (err) { return done(err); }
          //!!! TODO: This SHOULD be 201, but is broken in Sails .10 https://github.com/balderdashy/sails/issues/1840
          assert.equal(response.statusCode, 200);
          var p2 = JSON.parse(body);
          assert.notEqual(p1.uuid, p2.uuid);
          done();
        });
      });
    });

    it('create in draft project', function (done) {
      testEvent.projectId = draftProject.id;
      request.post({ url: conf.url + '/event',
                     body: JSON.stringify(testEvent)
                   }, function (err, response, body) {
        if (err) { return done(err); }
        //!!! TODO: This SHOULD be 201, but is broken in Sails .10 https://github.com/balderdashy/sails/issues/1840
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        draftEvent = b;
        done();
      });
    });

    it('attend', function (done) {
      request.get({ url: conf.url + '/event/attend/' + confirmedEvent.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          var b = JSON.parse(body);
          assert(b.id);
          assert.equal(b.eventId, confirmedEvent.id);
          assert(b.userId);
          done();
        });
    });

    it('attend in draft project', function (done) {
      request.get({ url: conf.url + '/event/attend/' + draftEvent.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          var b = JSON.parse(body);
          assert(b.id);
          assert.equal(b.eventId, draftEvent.id);
          assert(b.userId);
          done();
        });
    });

    it('rsvp', function (done) {
      request.get({ url: conf.url + '/event/rsvp/' }, function (err, response, body) {
        if (err) { return done(err); }
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.equal(b.length, 2);
        assert(_.contains(b, draftEvent.id));
        assert(_.contains(b, confirmedEvent.id));
        done();
      });
    });

    it('rsvp check a specific event', function (done) {
      request.get({ url: conf.url + '/event/rsvp/' + confirmedEvent.id}, function (err, response, body) {
        if (err) { return done(err); }
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.equal(b, true);
        done();
      });
    });

    it('cancel rsvp', function (done) {
      request.get({ url: conf.url + '/event/cancel/' + confirmedEvent.id },
        function (err, response, body) {
          if (err) { return done(err); }
          assert.equal(response.statusCode, 200);
          assert.equal(body, '');
          // re-add RSVP for later tests
          request.get({ url: conf.url + '/event/attend/' + confirmedEvent.id },
            function (err, response, body) {
              if (err) { return done(err); }
              assert.equal(response.statusCode, 200);
              var b = JSON.parse(body);
              assert(b.id);
              assert.equal(b.eventId, confirmedEvent.id);
              assert(b.userId);
              done();
            });
        });
    });

    it('view rsvp of draft event', function (done) {
      request.get({ url: conf.url + '/event/' + draftEvent.id },
                  function (err, response, body) {
        if (err) { return done(err); }
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        // check that the values passed in are the same as those passed back
        assert.equal(draftEvent.title, b.title);
        assert.equal(draftEvent.description, b.description);
        assert.equal(draftEvent.location, b.location);
        assert.equal(draftEvent.projectId, b.projectId);
        // make sure the automatically populated fields get set
        assert(b.id);
        assert(b.userId);
        assert(b.uuid);
        assert(b.status);
        // make sure you've RSVP'd
        assert.equal(b.rsvp, true);
        done();
      });
    });

    it('findAllByProjectId of draft event', function (done) {
      request.get({ url: conf.url + '/event/findAllByProjectId/' + draftProject.id },
                  function (err, response, body) {
        if (err) { return done(err); }
        assert.equal(response.statusCode, 200);
        var b = JSON.parse(body);
        assert.equal(b.events.length, 1);
        var ev = b.events[0];
        // check that the values passed in are the same as those passed back
        assert.equal(draftEvent.title, ev.title);
        assert.equal(draftEvent.description, ev.description);
        assert.equal(draftEvent.location, ev.location);
        assert.equal(draftEvent.projectId, ev.projectId);
        // make sure the automatically populated fields get set
        assert(ev.id);
        assert(ev.userId);
        assert(ev.uuid);
        assert(ev.status);
        // make sure you've RSVP'd
        assert.equal(ev.rsvp, true);
        assert.equal(ev.rsvps.length, 1);
        assert.equal(ev.rsvps[0], ev.userId);
        done();
      });
    });

    it('ical', function(done) {
      request.get({ url: conf.url + '/event/ical/' },
                  function(err, response, body) {
        assert.equal(response.statusCode, 200);
        assert.equal(response.headers['content-type'].toLowerCase(), 'text/calendar');
        var ical = icalendar.parse_calendar(body);
        var events = ical.events();
        assert.equal(events.length, 2);
        var foundEvent = false;
        for (var i = 0; i < events.length; i++) {
          // if the UID matches the public event, check its parameters
          if (events[i].getProperty('UID').value === confirmedEvent.uuid) {
            assert.equal(events[i].getProperty('SUMMARY').value, confirmedEvent.title);
            assert.equal(events[i].getProperty('DESCRIPTION').value, confirmedEvent.description);
            assert.equal(events[i].getProperty('LOCATION').value, confirmedEvent.location);
            var start = new Date(confirmedEvent.start);
            var end = new Date(confirmedEvent.end);
            start.setMilliseconds(0);
            end.setMilliseconds(0);
            assert.equal(events[i].getProperty('DTSTART').value.toString(), start.toString());
            assert.equal(events[i].getProperty('DTEND').value.toString(), end.toString());
            foundEvent = true;
          }
        }
        // Make sure we found the public event
        assert(foundEvent);
        done(err);
      });
    });


  });

  describe('logged out:', function () {

    before(function () {
      request = utils.init(true);
    });

    it('view', function (done) {
      request.get({ url: conf.url + '/event/' + confirmedEvent.id },
                  function(err, response, body) {
        if (err) { return done(err); }
        var b = JSON.parse(body);
        // check that the values passed in are the same as those passed back
        assert.equal(confirmedEvent.title, b.title);
        assert.equal(confirmedEvent.description, b.description);
        assert.equal(confirmedEvent.location, b.location);
        assert.equal(confirmedEvent.projectId, b.projectId);
        // make sure the automatically populated fields get set
        assert(b.id);
        assert(b.userId);
        assert(b.uuid);
        assert(b.status);
        // check if rsvp list is populated
        assert.equal(b.rsvps.length, 1);
        assert.equal(b.rsvp, false);
        done();
      });
    });

    it('view denied', function(done) {
      request.get({ url: conf.url + '/event/' + draftEvent.id },
                  function(err, response, body) {
        // access should be denied
        assert.equal(response.statusCode, 403);
        done(err);
      });
    });

    it('findAllByProjectId denied', function(done) {
      request.get({ url: conf.url + '/event/findAllByProjectId/' + draftProject.id },
                  function(err, response, body) {
        // access should be denied
        assert.equal(response.statusCode, 403);
        done(err);
      });
    });

    it('attend denied', function (done) {
      request.get({ url: conf.url + '/event/attend/' + confirmedEvent.id },
        function (err, response, body) {
          assert.equal(response.statusCode, 403);
          done(err);
        });
    });

    it('cancel denied', function (done) {
      request.get({ url: conf.url + '/event/cancel/' + confirmedEvent.id },
        function (err, response, body) {
          assert.equal(response.statusCode, 403);
          done(err);
        });
    });

    it('rsvp denied', function (done) {
      request.get({ url: conf.url + '/event/rsvp/' + confirmedEvent.id}, function (err, response, body) {
        assert.equal(response.statusCode, 403);
        done(err);
      });
    });

    it('ical', function(done) {
      request.get({ url: conf.url + '/event/ical/' + publicProject.id },
                  function(err, response, body) {
        assert.equal(response.statusCode, 200);
        assert.equal(response.headers['content-type'].toLowerCase(), 'text/calendar');
        var ical = icalendar.parse_calendar(body);
        var events = ical.events();
        assert.equal(events.length, 3);
        var foundEvent = false;
        for (var i = 0; i < events.length; i++) {
          // if the UID matches the public event, check its parameters
          if (events[i].getProperty('UID').value === confirmedEvent.uuid) {
            assert.equal(events[i].getProperty('SUMMARY').value, confirmedEvent.title);
            assert.equal(events[i].getProperty('DESCRIPTION').value, confirmedEvent.description);
            assert.equal(events[i].getProperty('LOCATION').value, confirmedEvent.location);
            var start = new Date(confirmedEvent.start);
            var end = new Date(confirmedEvent.end);
            start.setMilliseconds(0);
            end.setMilliseconds(0);
            assert.equal(events[i].getProperty('DTSTART').value.toString(), start.toString());
            assert.equal(events[i].getProperty('DTEND').value.toString(), end.toString());
            foundEvent = true;
          }
        }
        // Make sure we found the public event
        assert(foundEvent);
        done(err);
      });
    });

    it('ical denied', function(done) {
      request.get({ url: conf.url + '/event/ical/' + draftProject.id },
                  function(err, response, body) {
        assert.equal(response.statusCode, 403);
        done(err);
      });
    });

  });

});
