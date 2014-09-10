/**
 *  This handles all automated notification services for the midas application
 */

var util = require("util");
var events = require("events");
var _ = require('underscore');
var async = require('async');
var uuid = require('node-uuid');
var lib = require('../utils/lib');

var notificationBuilder = new NotificationBuilder();

/**
 * public function that performs notification action triggered by a set of parameters stored in 'param' object
 * @params - object of the following form (analogous to triggerRoutes config item in notifications.js)
 *
 *  params: {
 *    trigger: {
 *      callerType: <action-specific>,
 *      callerId: <action-specific>,
 *      action : <action-specific>
 *    }
 *    data: {
 *      audience: {
 *        <audienceName>: {
 *          fields: { <audience-specific> },
 *          settings: { <audience-specific> },
 *          strategy: {
 *            <strategyName>: {
 *              preflight: {
 *                <preflightName>: {
 *                  fields: { <preflight-specific> },
 *                  settings: { <preflight-specific> }
 *                },
 *                ...
 *              },
 *              delivery: {
 *                <deliveryType>: {
 *                  fields: { <deliveryType-specific> },
 *                  settings: { <deliveryType-specific> }
 *                }
 *              }
 *            },
 *            ...
 *          }
 *        },
 *        ...
 *      }
 *    }
 *
 *
 *    recipients: [ <output> ],
 *    notifications: [ <output> ],
 *    deliveries: [ <output> ]
 * @cb - callback function that accepts error as parameter 1 and the modified params object as parameter 2
 */
function NotificationBuilder () {
  this.notify = function notify (params, cb) {
    // allow execution to continue first, then notify
    cb(null);
    // these are unique to this notify call
    var actionID, createdDate, action;
    // preconfiguring param structure
    params.trigger = params.trigger || {};
    params.data = params.data || {};
    params.data.audience = params.data.audience || {};
    // initial state check
    if( !params.trigger.hasOwnProperty("callerType") ||
        !params.trigger.hasOwnProperty('callerId') ||
        !params.trigger.hasOwnProperty('action') ) {
      throw new Error(arguments.callee.name + ' has received an improperly-defined parameter');
    }
    // these are shared among all notifications produced from same notify() call
    actionID = uuid.v4();
    createdDate = new Date();
    // find audience for action, then create notifications for each audience member, then send deliveries for each notification.
    // first fork in the execution path
    // Structure is far from ideal, but it must be done this way to get around the cumbersome single parameter restriction in the async library's "each" function
    async.each(Object.keys(sails.config.notifications.triggerRoutes[params.trigger.action].audience), startNotify, function (err) {
      if (err) {
        // log the notificaiton error
        sails.log.warning("Notification Error:", err);
      }
    });

    function startNotify (audience, done) {
      // get subscriber list for action
      populateRecipients(audience, function (err, recipients, audience){
        // begin the delivery process, will fork execution into a fan of callbacks for each Notification and again for each delivery
        function finishNotify (recipient, fin) {
          // make Notification model for each recipient
          generateNotifications(audience, recipient, function (err, notification, audience, recipient){
            // kick off delivery process for each recipient, will end up forking execution again for each delivery
            deliverNotification(audience, notification, recipient, fin);
          });
        }
        // second fork in the execution path
        async.each(recipients, finishNotify, done);
      });
    };

    /**
     * private function that configures audience settings from main param, then populates and validates fields from main param, then returns recipient pool
     * @audience - name of audience
     */
    function populateRecipients (audience, done) {
      params.data.audience[audience] = params.data.audience[audience] || {};
      // combine global default settings with local settings to produce master settings list
      synthesizeSettings(
        params.data.audience[audience],
        sails.config.notifications.audiences[audience],
        function (err, settings) {
          if(err){ sails.log.debug(err); done(null, [], audience); return false;}
          // combine global default fields with local fields to produce master fields list
          var fields = params.data.audience[audience].fields;
          // get recipient list and return it in callback
          performServiceAction(
            sails.services.audience[sails.config.notifications.audiences[audience].method],
            // pass in master settings and fields
            { settings: settings, fields: fields },
            function (err, recipients) {
              if(err){ sails.log.debug(err); done(null, recipients, audience); return false;}
              done(null, recipients, audience);
            }
          );
        }
      );
    };

    /**
     * private function that makes a notification for the notification action for each recipient
     * @audience - name of audience
     * @user - user to whom the notification is being related (recipient)
     */
    function generateNotifications (audience, user, done) {
      // persists notification representation, then return it in callback
      Notification.create({
        callerType: params.trigger.callerType,
        callerId: params.trigger.callerId,
        triggerGuid: actionID,
        action: params.trigger.action,
        audience: audience,
        recipientId: user.id,
        createdDate: createdDate,
        localParams: JSON.stringify(params.data.audience[audience]),
        globalParams: JSON.stringify(sails.config.notifications.triggerRoutes[params.trigger.action].audience[audience])
      }).exec(function (err, newNotification){
        if (err) {
          sails.log.debug(err);
          done(null, newNotification, audience, user);
          return false;
        }
        done(null, newNotification, audience, user);
      });
    };

    /**
     * private function that iterates through each delivery for the given notification and processes it
     * @audience - name of audience
     * @notification - notification object
     * @recipient - user to whom the delivery is being sent
     */
    function deliverNotification (audience, notification, recipient, callback) {
      // iterate through all strategies defined for deliverables to be dispached to the given audience
      // this will likely only ever just be a single strategy, but the edge case possibility exists
      // third fork in the execution path
      async.each(
        Object.keys(sails.config.notifications.triggerRoutes[params.trigger.action].audience[audience].strategy),
        deliverEachStrategy,
        callback
      );
      /**
       * private function that kicks off and then follows to completion the delivery proces for a given strategy
       * @strategyName - string name of strategy type which defined preflight strategies and delivery strategy
       */
      function deliverEachStrategy (strategyName, done) {
        var strategy;
        // this will hold the content which will eventually be consumed by the delivery method
        var preflightContent = {};
        // ensuring proper object structure
        params.data.audience[audience].strategy = params.data.audience[audience].strategy || {};
        params.data.audience[audience].strategy[strategyName] = params.data.audience[audience].strategy[strategyName] || {};
        params.data.audience[audience].strategy[strategyName].preflight = params.data.audience[audience].strategy[strategyName].preflight || {};
        params.data.audience[audience].strategy[strategyName].delivery = params.data.audience[audience].strategy[strategyName].delivery || {};
        // var created for convenience, as object is very deep and cumbersome
        strategy = sails.config.notifications.triggerRoutes[params.trigger.action].audience[audience].strategy[strategyName];
        strategy.preflight = strategy.preflight || [];
        // This performs all preflight activity required for final delivery, then calls that delivery function on callback
        // fourth and final fork in the execution path
        async.each(strategy.preflight, preparePreflight, function (err) {
          prepareDelivery(audience, notification, recipient, strategyName, strategy.delivery, preflightContent, done);
        });
        /**
         * private function that consumes main param fields/settings and performs all pre-flight notification preparation for delivery
         * @preflightStrategy - string name of preflight strategy type
         */
        function preparePreflight (preflightStrategy, done) {
          params.data.audience[audience].strategy[strategyName].preflight[preflightStrategy] = params.data.audience[audience].strategy[strategyName].preflight[preflightStrategy] || {};
          // local parameter preflight settings and fields transferred over to a new object to be modified
          var localVars = _.extend({}, params.data.audience[audience].strategy[strategyName].preflight[preflightStrategy]);
          localVars.fields = localVars.fields || {};
          // add the recipient's user info to the metadata
          localVars.fields.metadata = {
            recipient: recipient
          };
          // recipientId and callerId added to fields for convenience, as they will almost always come in handy
          localVars.fields.recipientId = recipient.id;
          localVars.fields.callerId = notification.callerId;
          // combine global default settings with local settings to produce master settings list
          synthesizeSettings(
            localVars,
            sails.config.notifications.preflights[preflightStrategy],
            function (err, settings) {
              if (err) { sails.log.debug(err); done(null); return false;}
              // combine global default fields with local fields to produce master fields list
              var fields = localVars.fields;
              // get generated delivery content and return it in callback
              performServiceAction(
                sails.services.preflight[sails.config.notifications.preflights[preflightStrategy].method],
                // master fields and settings passed in
                { settings: settings, fields: fields },
                function (err, content) {
                  if (err) { sails.log.debug(err); done(null); return false;}
                  // mix new delivery content in with existing content
                  preflightContent = lib.deepExtend(preflightContent, content);
                  done(err);
                }
              );
            }
          );
        };
      };

      /**
       * private function that consumes main param fields/settings and generates a delivery and sends it
       * @audience - name of audience
       * @notification - notification object
       * @recipient - user to whom the delivery is being sent
       * @deliveryStrategy - string name of delivery strategy defined in the notifications config
       * @content - content to be added to delivery data
       */
      function prepareDelivery (audience, notification, recipient, strategyName, deliveryStrategy, content, done) {
        params.data.audience[audience].strategy[strategyName].delivery[deliveryStrategy] = params.data.audience[audience].strategy[strategyName].delivery[deliveryStrategy] || {};
        // local parameter delivery settings and fields transferred over to a new object to be modified
        var localVars = _.extend({}, params.data.audience[audience].strategy[strategyName].delivery[deliveryStrategy]);
        localVars.fields = localVars.fields || {};
        localVars.settings = localVars.settings || {};
        // mix-in results of preflight functions
        localVars = lib.deepExtend(content, localVars);
        // check if the recipient is the same as the initiator;
        // if so, supress sending emails to yourself
        if (localVars && localVars.fields && (recipient.id === localVars.fields.initiatorId)) {
          // oohlala: The recipient is the same person as the initiator
          // supress the delivery since clearly they know what they did.
          done(null, null);
          return false;
        }
        // combine global default settings with local settings to produce master settings list
        synthesizeSettings(
          localVars,
          sails.config.notifications.deliveries[deliveryStrategy],
          // include user settings template to find and incorporate appropriate global overrides
          {
            userId: recipient.id,
            action: params.trigger.action,
            audience: audience,
            delivery: deliveryStrategy
          },
          function (err, settings) {
            if (err) { sails.log.debug(err); done(null, null); return false;}
            // combine global default fields with local fields to produce master fields list
            var fields = localVars.fields;
            // goes ahead and persists the delivery model here, as the fields/settings produced in prior callback will still be in scope
            generateDelivery(audience, notification, deliveryStrategy, content, function(err, delivery){
              if (err) { sails.log.debug(err); done(null, null); return false;}
              // makes use of master fields/settings in scope and dispatches the delivery
              registerDeliveryAsSent(delivery, { settings: settings, fields: fields }, done);
            });
          }
        );
      };

      /**
       * private function creates the delivery model
       * @audience - name of audience
       * @notification - notification object
       * @deliveryType - string name of delivery type
       * @content - content to be added to delivery data
       */
      function generateDelivery (audience, notification, deliveryType, content, done) {
        // persists delivery representation and returns it
        Delivery.create({
          notificationId: notification.id,
          deliveryType: deliveryType,
          content: JSON.stringify(content)
        }).exec(function (err, delivery){
          if (err) { sails.log.debug(err); done(null, delivery); return false; }
          done(err, delivery);
        });
      };

      /**
       * private function that updates a delivery as sent
       * @delivery - string name of delivery type
       * @paramObject - parameters to be sent to delivery
       */
      function registerDeliveryAsSent (delivery, paramObject, done) {
        // perform delivery action and return response in callback
        performServiceAction(
          sails.services.dispatch[sails.config.notifications.deliveries[delivery.deliveryType].method],
          paramObject,
          function (err, response) {
            if (err) { sails.log.debug(err); done(null); return false; }
            // update delivery to reflect its completed status
            delivery.isDelivered = true;
            delivery.deliveryDate = new Date();
            delivery.save(done);
          }
        );
      };
    }

    /**
     * private helper function that properly sets all settings
     * @hostObject - object that contains a settings property
     * @globalObject - global object that contains a settings property
     * @userSettingTemplate - optional property that contains a match for user settings
     */
    function synthesizeSettings (hostObject, globalObject, userSettingTemplate, done) {
      var settings, localSettings, globalSettings;
      // ensure both parameter objects have proper form
      hostObject.settings = hostObject.settings || {};
      if (_.isUndefined(globalObject)) {
        globalObject = {};
      }
      globalObject.settings = globalObject.settings || {};
      settings = {};
      localSettings = _.extend({}, hostObject.settings);
      globalSettings = _.extend({}, globalObject.settings);
      if (typeof userSettingTemplate === 'function'){
        // if userSettingTemplate not included, so bypasses user settings
        done = userSettingTemplate;
        // simply mix-in global and local settings and callback
        settings = lib.deepExtend(globalSettings, localSettings);
        done(null, settings);
      }
      else {
        // user setting template is included, so pull related delivery settings and mix those in with the rest
        UserSetting.find({
          userId: userSettingTemplate.userId,
          context: JSON.stringify({ action: userSettingTemplate.action, audience: userSettingTemplate.audience, delivery: userSettingTemplate.delivery })
        }).exec(function (err, settings) {
          if (err) { sails.log.debug(err); done(null, settings); return false;}
          userSettingObject = {};
          userSettingObject[userSettingTemplate.actionType] = {};
          userSettingObject[userSettingTemplate.actionType].audience = {};
          userSettingObject[userSettingTemplate.actionType].audience[userSettingTemplate.audience] = {};
          _.each(settings, function (userSetting) {
            userSettingObject[userSettingTemplate.actionType].audience[userSettingTemplate.audience][userSetting.key] =  userSetting.value;
          });
          // setting priority is local > user > global
          settings = lib.deepExtend(
            globalSettings,
            userSettingObject,
            localSettings
          );
          done(err, settings);
        });
      }
    };

    /**
     * private helper function that fires off a service method
     * @actor - object upon which the service is called
     * @action - service method to call
     * @actionParams - object with fields and settings to be applied in the method
     */
    function performServiceAction (actor, actionParams, done) {
      actor.execute(
        actionParams.fields,
        actionParams.settings,
        done
      );
    }
  };
}

module.exports = {
  notifier: notificationBuilder
};
