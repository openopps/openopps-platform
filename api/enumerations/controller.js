const log = require('log')('app:enumerations');
const Router = require('koa-router');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/enumerations/bureaus', async (ctx, next) => {
  ctx.body = await service.getBureausAll();
});
router.get('/api/enumerations/payPlans', async (ctx, next) => {
  ctx.body = await service.getPayLevelAll();
});


module.exports = router.routes();
