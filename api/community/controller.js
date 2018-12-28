const log = require('log')('app:community');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

function initializeAuditData (ctx) { 
  return {
    path: ctx.path,
    method: ctx.method,
    status: 'blocked',
  };
}

var router = new Router();

router.get('/api/community/:id', auth, async (ctx, next) => {
  ctx.body = await service.findById(ctx.params.id);
  // await service.findById(ctx.params.id, (community) => {
  //   ctx.body = community;
  // });
});

router.post('/api/community/member', auth, async (ctx, next) => {
  if(await service.isCommunityManager(ctx.state.user, ctx.request.body.communityId)) {
    await service.addCommunityMember(ctx.request.body, (err) => {
      if (err) {
        ctx.status = 400;
        ctx.body = err.message;
      } else {
        service.createAudit('COMMUNITY_ADD_MEMBER', ctx, _.extend(ctx.request.body, { role: ctx.state.user.isAdmin ? 'Admin' : 'Community Manager' }));
        ctx.status = 200;
      }
    });
  } else {
    await service.createAudit('FORBIDDEN_ACCESS', ctx, initializeAuditData(ctx));
    ctx.status = 403;
  }
});

module.exports = router.routes();