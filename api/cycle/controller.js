const log = require('log')('app:cycle');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/cycle/:id', async (ctx, next) => {
  ctx.body = await service.findById(ctx.params.id);
});

router.get('/api/cycle/community/:id', async (ctx, next) => {
  ctx.body = await service.list(ctx.params.id);
});

router.post('/api/cycle', async (ctx, next) => {
  // check for community id and that you are a manager
});

module.exports = router.routes();