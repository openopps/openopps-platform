/**
 * EventController
 *
 * @module		:: Controller
 * @description	:: Interaction with events
 */

var _ = require('underscore');
var async = require('async');
var icalendar = require('icalendar');
var projUtils = require('../services/utils/project');

module.exports = {

  find: function (req, res) {
    Event.findOneById(req.params.id, function (err, ev) {
      if (err) { return res.send(400, { message: 'Error looking up events.'}); }
      var userId = null;
      if (req.user) {
        userId = req.user[0].id;
      }
      projUtils.authorized(ev.projectId, userId, function (err, proj) {
        if (err) { return res.send(400, { message: err }); }
        if (!err && !proj) { return res.send(403, { message: 'Not authorized.'}); }
        // Get RSVP's for display
        EventRsvp.findByEventId(ev.id, function (err, rsvps) {
          ev.rsvps = [];
          for (var i = 0; i < rsvps.length; i++) {
            ev.rsvps.push(rsvps[i].userId);
          }
          // Check if this user has RSVP'd
          ev.rsvp = false;
          if (userId && _.contains(ev.rsvps, userId)) {
            ev.rsvp = true;
          }
          return res.send(ev);
        });
      });
    });
  },

  findOne: function (req, res) {
    module.exports.find(req, res);
  },

  findAllByProjectId: function (req, res) {
    userId = null;
    if (req.user) { userId = req.user[0].id; }
    Event.find()
    .where({ projectId: req.params.id })
    .where({ end: { '>': new Date().toISOString() }})
    .sort('start')
    .exec(function (err, events) {
      if (err) return res.send(400, { message: 'Error looking up events.'});
      // helper function to take an event and check the RSVP state
      var checkRsvp = function (ev, done) {
        EventRsvp.findByEventId(ev.id, function (err, rsvps) {
          ev.rsvps = [];
          for (var i = 0; i < rsvps.length; i++) {
            ev.rsvps.push(rsvps[i].userId);
          }
          // Check if this user has RSVP'd
          ev.rsvp = false;
          if (userId && _.contains(ev.rsvps, userId)) {
            ev.rsvp = true;
          }
          return done();
        });
      };
      // for each project, check if the user has rsvp'd.
      async.each(events, checkRsvp, function (err) {
        if (err) { return res.send(400, { message: 'Error looking up rsvp.'}); }
        return res.send({ events: events });
      });
    });
  },

  /**
   * Register interest in attending an event.
   * Syntax: /event/attend/:id where :id is eventId
   * Returns: RSVP object if successful, HTTP error otherwise
   */
  attend: function (req, res) {
    Event.findOneById(req.params.id, function (err, ev) {
      if (err) { return res.send(400, { message: 'Error looking up events.'}); }
      var userId = null;
      if (req.user) {
        userId = req.user[0].id;
      }
      projUtils.authorized(ev.projectId, userId, function (err, proj) {
        if (err) { return res.send(400, { message: err }); }
        if (!err && !proj) { return res.send(403, { message: 'Not authorized.'}); }
        attend = { eventId: ev.id, userId: userId };
        EventRsvp.findOne({ where: attend}, function (err, existing) {
          if (err) { return res.send(400, { message: 'Error creating attendance.' }); }
          if (existing) { return res.send(existing); }
          EventRsvp.create(attend, function (err, attend) {
            if (err) { return res.send(400, { message: 'Error creating attendance.' }); }
            return res.send(attend);
          });
        });
      });
    });
  },

  /**
   * Cancel interest in attending event.
   * Syntax: /event/cancel/:id where :id is eventId
   * Returns: `null` if successful, HTTP error otherwise
   */
  cancel: function (req, res) {
    EventRsvp.findOne({ where: { eventId: req.params.id, userId: req.user[0].id }}, function (err, attend) {
      if (err) { return res.send(400, { message: 'Error finding event rsvp.' }); }
      if (!attend) { return res.send(null); }
      attend.destroy(function(err) {
        if (err) { return res.send(400, { message: 'Error destroying event rsvp.' }); }
        return res.send(null);
      });
    });
  },

  /**
   * Get a list of events that a user has RSVP'd if no :id is specified.
   * Otherwise returns the rsvp state of the event for this user for
   * a specified event
   * Input: /event/rsvp/:id - Returns: true/false
   * Input: /event/rsvp/ - Returns: [ eventId, eventId, ... ]
   */
  rsvp: function (req, res) {
    // if an :id is specified, check for that event and return true/false
    if (req.params.id) {
      EventRsvp.findOne({ where: { eventId: req.params.id, userId: req.user[0].id }},
        function (err, rsvp) {
          if (err) { return res.send(400, { message: 'Error finding event rsvp.' }); }
          if (rsvp) { return res.send(true); }
          return res.send(false);
      });
    }
    // otherwise find all events for this user
    else {
      EventRsvp.findByUserId(req.user[0].id, function (err, rsvps) {
        if (err) { return res.send(400, { message: 'Error finding event rsvp.' }); }
        var result = [];
        for (var i = 0; i < rsvps.length; i++) {
          result.push(rsvps[i].eventId);
        }
        res.send(result);
      });
    }
  },

  /**
   * Generate an iCal calendar for a given project id (/event/ical/:id)
   * If no :id is specified, provide an iCal calendar for the user's RSVPs
   */
  ical: function (req, res) {
    var genCal = function (events) {
      var ical = new icalendar.iCalendar();
      // set calendar name (X-WR-CALNAME?)
      for (var i = 0; i < events.length; i++) {
        var ev = new icalendar.VEvent(events[i].uuid);
        ev.setSummary(events[i].title);
        ev.setDate(new Date(events[i].start), new Date(events[i].end));
        ev.setDescription(events[i].description);
        if (events[i].location) {
          ev.addProperty('LOCATION', events[i].location);
        }
        // set location
        // set status
        ical.addComponent(ev);
      }
      var filename = '';
      if (req.params.id) {
        filename = 'project' + req.params.id + '.ical';
      }
      else {
        filename = req.user[0].username + '.ical';
      }
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
      res.type('text/calendar');
      res.send(ical.toString());
    };

    // if an :id is specified, provide events for a specific project
    if (req.params.id) {
      Event.findByProjectId(req.params.id, function (err, events) {
        if (err) return res.send(400, { message: 'Error looking up events.'});
        // generate iCal entries
        genCal(events);
      });
    }
    // otherwise provide an iCal calendar for the user's RSVPs.
    else if (req.user) {
      // get all of the RSVPs
      EventRsvp.findByUserId(req.user[0].id, function (err, rsvps) {
        // now get all of the events
        var events = [];
        var getEvents = function (rsvp, done) {
          Event.findOneById(rsvp.eventId, function (err, ev) {
            if (err) { return done(err); }
            events.push(ev);
            done();
          });
        };
        async.each(rsvps, getEvents, function (err) {
          if (err) return res.send(400, { message: 'Error looking up events.'});
          genCal(events);
        });
      });
    }
    else {
      res.send(403, { message: 'Not authorized.'} );
    }
  }

};
