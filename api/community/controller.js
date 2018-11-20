const log = require('log')('app:community');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/community/:id', auth, async (ctx, next) => {
  await service.findById(ctx.params.id, (community) => {
    ctx.body = community;
  });
});

module.exports = router.routes();