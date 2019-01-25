const log = require('log')('app:application');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/application/:id', auth, async (ctx, next) => {
});

router.get('/application/:userId/:communityId', auth, async (ctx, next) => {
});

router.post('/application/apply/:taskId', auth, async (ctx, next) => {
  await service.apply(ctx.state.user.id, ctx.params.taskId, (err, applicationId) => {
    if (err) {
      ctx.status = 400;
      ctx.body = err;
    } else {
      ctx.redirect('/application/' + applicationId);
    }
  });
});

module.exports = router.routes();