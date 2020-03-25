const log = require('log')('app:community');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const documentService = require('../document/service');
const elasticService = require('../../elastic/service');

function initializeAuditData (ctx) { 
  return {
    path: ctx.path,
    method: ctx.method,
    status: 'blocked',
  };
}

var router = new Router();

router.get('/api/community/:id', async (ctx, next) => {
  ctx.body = await service.findById(ctx.params.id);
});

router.put('/api/community/:id', auth, async (ctx, next) => {
  if(await service.isCommunityManager(ctx.state.user, ctx.request.body.communityId)) {
    await service.updateCommunity(ctx.request.body, (err) => {
      if (!err) {
        elasticService.reindexCommunityOpportunities(ctx.request.body.communityId);
      }
      ctx.status = err ? 400 : 200;
      ctx.body = err ? '': { message: 'success' };
    });
  } else {
    await service.createAudit('FORBIDDEN_ACCESS', ctx, initializeAuditData(ctx));
    ctx.status = 403;
  }
});

router.post('/api/community', auth.isAdmin, async (ctx, next) => {
  await service.saveCommunity(ctx.request.body, function (errors,community)  {
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {
      ctx.status = 200;
      ctx.body = community;
    }
  });
});

router.get('/api/community/:id/cycles', async (ctx, next) => {
  ctx.body = await service.getActiveCycles(ctx.params.id);
});

router.post('/api/community/:id/member', auth.isCommunityApprover, async (ctx, next) => {
  await service.addCommunityMember(ctx.request.body, (err) => {
    if (err) {
      ctx.status = 400;
      ctx.body = err.message;
    } else {
      service.sendCommunityInviteNotification(ctx.state.user, ctx.request.body);
      service.createAudit('COMMUNITY_ADD_MEMBER', ctx, _.extend(ctx.request.body, { role: ctx.state.user.isAdmin ? 'Admin' : 'Community Manager' }));
      ctx.status = 200;
    }
  });
});

router.get('/api/communities/:audienceType/details', async (ctx, next) => {
  ctx.body = await service.detailsByAudienceType(ctx.params.audienceType);
});

// router.get('/api/community/logo/get/:id', async (ctx, next) => {
//   var community = await service.findById(ctx.params.id);
//   if (!community) {
//     ctx.redirect('');
//   }
//   if (community.imageId) {
//     ctx.status = 307;
//     ctx.redirect('/api/upload/get/' + community.imageId);
//   }
// });

router.post('/api/community/logo/remove/:id', auth.isAdmin, async (ctx, next) => {
  var result = await documentService.removeFile(ctx.params.id);
  if(!result) {
    return ctx.status = 404;
  }
  await service.updateCommunity(ctx.request.body, (err, community) => {
    if (!err) {
      elasticService.reindexCommunityOpportunities(community.communityId);
    }
    ctx.status = err ? 400 : 200;
    ctx.body = err ? '': community;
  });
});

router.post('/api/community/logo/update/:id', auth.isAdmin, async (ctx, next) => {
  var community = await service.findById(ctx.params.id);
  await service.updateCommunity(ctx.request.body, (err, community) => {
    if (!err) {
      elasticService.reindexCommunityOpportunities(community.communityId);
    }
    ctx.status = err ? 400 : 200;
    ctx.body = err ? '' : community;
  });
});

router.get('/api/community/backgroundImage/get/:id', async (ctx, next) => {
  var community = await service.findById(ctx.params.id);
  if (!community) {
    ctx.redirect('');
  }
  if (community.banner.backgroundImageId) {
    ctx.status = 307;
    ctx.redirect('/api/upload/get/' + community.banner.backgroundImageId);
  }
});

module.exports = router.routes();