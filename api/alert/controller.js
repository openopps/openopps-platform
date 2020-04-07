const log = require('log')('app:alert');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/alerts', async (ctx, next) => {
  await service.getAlerts().then(alerts => {
    ctx.body = alerts;
  }).catch(err => {
    log.error(err);
    ctx.status = 400;
  });
});

router.get('/api/alerts/:page', async (ctx, next) => {
  await service.getAlertsForPage(ctx.params.page).then(alerts => {
    ctx.body = alerts;
  }).catch(err => {
    log.error(err);
    ctx.status = 400;
  });
});

module.exports = router.routes();