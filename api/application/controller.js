const log = require('log')('app:application');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/application/:id', auth, async (ctx, next) => {
});

router.get('/api/application/:userId/:communityId', auth, async (ctx, next) => {
});

router.post('/api/application/apply/:taskId', auth, async (ctx, next) => {
  await service.apply(ctx.state.user.id, ctx.params.taskId, (err, applicationId) => {
    ctx.status = err ? 400 : 200;
    ctx.body = err ? err : applicationId;
  });
});

module.exports = router.routes();