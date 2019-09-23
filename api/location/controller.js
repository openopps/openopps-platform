const log = require('log')('app:location');
const Router = require('koa-router');
const request = require('request');
const qs = require('querystring');
const _ = require('lodash');

var router = new Router();

router.get('/api/location/suggest', async (ctx, next) => {
  log.info('ctx.query', ctx.query);
  var urlBase = 'http://api.geonames.org/search';
  var query = _.defaults(ctx.query, {
    type: 'json',
    style: 'full',
    maxRows: 10,
    username: 'midas',
    countryBias: 'US',
    featureClass: 'P',
  });
  var url = urlBase + '?' + qs.stringify(query);

  return new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
      if(error) {
        resolve([]);
      } else {
        try {
          var data = JSON.parse(body);
          if (!data.geonames) {
            resolve(data);
          } else {
            resolve(data.geonames.map(function (item) {
              var name = [item.toponymName];
              if (item.toponymName !== item.adminName1) name.push(item.adminName1);
              if (item.countryCode !== 'US') name.push(item.countryCode);
              return _.extend({
                name: name.join(', '),
                lat: item.lat,
                lon: item.lng,
                source: 'geonames',
                sourceId: item.geonameId,
              }, item.timezone);
            }));
          }
        } catch (e) {
          resolve([]);
        }
      }
    });
  }).then(data => {
    ctx.body = data;
  });
});

module.exports = router.routes();
