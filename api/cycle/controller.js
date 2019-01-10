const log = require('log')('app:cycle');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const communityService = require('../community/service');

function initializeAuditData (ctx) { 
  return {
    path: ctx.path,
    method: ctx.method,
    status: 'blocked',
  };
}

var router = new Router();

router.get('/api/cycle/:id', async (ctx, next) => {
  ctx.body = await service.findById(ctx.params.id);
});

router.get('/api/cycle/community/:id', async (ctx, next) => {
  ctx.body = await service.list(ctx.params.id);
});

router.post('/api/cycle', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.request.body.communityId)) {
    await service.addCycle(_.extend(ctx.request.body, { updatedBy: ctx.state.user.id }), (cycle, err) => {
      if(err) {
        ctx.status = 400;
        ctx.body = err.message;
      } else {
        ctx.status = 200;
        ctx.body = cycle;
      }
    });
  } else {
    await service.createAudit('FORBIDDEN_ACCESS', ctx, initializeAuditData(ctx));
    ctx.status = 403;
  }
});

module.exports = router.routes();