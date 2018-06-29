const log = require('log')('app:admin');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/announcement', async (ctx, next) => {
  ctx.body = await service.getAnnouncement();
});

router.put('/api/announcement', auth.isAdmin, async (ctx, next) => {
  await service.updateAnnouncement(ctx.request.body, ctx.state.user.id, function (errors, result) {
    if (errors) {
      ctx.status = 400;
      return ctx.body = errors;
    }
    ctx.body = result;
  });
});

module.exports = router.routes();