const log = require('log')('app:admin');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const communityService = require('../community/service');

var router = new Router();

router.get('/api/admin/metrics', auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getMetrics();
});

router.get('/api/admin/activities', auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getActivities();
});

router.get('/api/admin/agency/:id/activities', auth, async (ctx, next) => {
  ctx.body = await service.getAgencyActivities(ctx.params.id);
});

router.get('/api/admin/community/:id/activities', auth, async (ctx, next) => {
  ctx.body = await service.getCommunityActivities(ctx.params.id);
});

router.get('/api/admin/interactions', auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getInteractions();
});

router.get('/api/admin/taskmetrics', auth.isAdmin, async (ctx, next) => {
  var group = ctx.query.group;
  var filter = ctx.query.filter;
  ctx.body = await service.getDashboardTaskMetrics(group, filter);
});

router.get('/api/admin/users', auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getUsers(ctx.query.page, ctx.query.filter, ctx.query.sort);
});

router.get('/api/admin/contributors', auth.isAdmin, async (ctx, next) => {
  await service.getTopContributors().then(results => {
    ctx.body = results;
  }).catch(err => {
    ctx.status = 400;
  });
});

router.get('/api/admin/agency/:id/contributors', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  await service.getTopAgencyContributors(ctx.params.id).then(results => {
    ctx.body = results;
  }).catch(err => {
    ctx.status = 400;
  });
});

router.get('/api/admin/tasks', auth.isAdmin, async (ctx, next) => {
  //ctx.body = await service.getTaskStateMetrics();
  await service.getTaskStateMetrics(ctx.query.status, ctx.query.page, ctx.query.sort, ctx.query.filter).then(results => {
    ctx.body = {
      totals: results[0].rows,
      tasks: results[1].rows,
    };
  }).catch(err => {
    ctx.status = 400;
  });
});

router.get('/api/admin/agencies',auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getAgencies();
});

router.get('/api/admin/community/agencies', async (ctx, next) => {
  ctx.body = await service.getAgencies();
});
router.get('/api/admin/agency/:id', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  ctx.body = await service.getAgency(ctx.params.id);
});

router.get('/api/admin/agency/:id/users', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  ctx.body = await service.getUsersForAgency(ctx.query.page, ctx.query.filter, ctx.query.sort, ctx.params.id);
});

router.get('/api/admin/agency/:id/tasks', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  //ctx.body = await service.getAgencyTaskStateMetrics(ctx.params.id);
  await service.getAgencyTaskStateMetrics(ctx.params.id, ctx.query.status, ctx.query.page, ctx.query.sort, ctx.query.filter).then(results => {
    ctx.body = {
      totals: results[0].rows,
      tasks: results[1].rows,
    };
  }).catch(err => {
    ctx.status = 400;
  });
});

router.get('/api/admin/agency/:id/interactions', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  ctx.body = await service.getInteractionsForAgency(ctx.params.id);
});

router.get('/api/admin/agency/taskmetrics/:id', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  var group = ctx.query.group;
  var filter = ctx.query.filter;
  var agencyId= ctx.params.id;
  ctx.body = await service.getDashboardAgencyTaskMetrics(group, filter,agencyId);
});
router.get('/api/admin/community/:id/tasks', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    //ctx.body = await service.getCommunityTaskStateMetrics(ctx.params.id);
    await service.getCommunityTaskStateMetrics(ctx.params.id,ctx.query.cycle, ctx.query.status, ctx.query.page, ctx.query.sort, ctx.query.filter).then(results => {
      ctx.body = {
        totals: results[0].rows,
        tasks: results[1].rows,
      };
    }).catch(err => {
      ctx.status = 400;
    });
  } else {
    ctx.status = 403;
  }
});


router.get('/api/admin/community/:id/cyclical/:cycleId', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    ctx.body = await service.getCommunityCycle(ctx.params.id,ctx.params.cycleId);
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/community/interactions/:id/cyclical/:cycleId', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    ctx.body = await service.getInteractionsForCommunityCyclical(ctx.params.id,ctx.params.cycleId);
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/communities', auth, async (ctx, next) => {
  var communities =  await service.getCommunities(ctx.state.user);
  if (communities.length) {
    ctx.body = communities;
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/community/:id', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    ctx.body = await service.getCommunity(ctx.params.id);
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/community/interactions/:id', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    ctx.body = await service.getInteractionsForCommunity(ctx.params.id);
  } else {
    ctx.status = 403;
  }
});

router.put('/api/admin/community/:id/bureau-office', auth, async (ctx, next) => {
  await service.saveBureauOffice(ctx,ctx.request.body, async (errors, result) => {    
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {     
      ctx.status = 200;
      ctx.body = result;
    }
  }); 
});


router.get('/api/admin/community/:id/users', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    ctx.body = await service.getUsersForCommunity(ctx.query.page, ctx.query.filter, ctx.query.sort, ctx.params.id);
  } else {
    ctx.status = 403;
  }
});
router.get('/api/admin/community/taskmetrics/:id', auth, async (ctx, next) => {
  var group = ctx.query.group;
  var filter = ctx.query.filter;
  var communityId= ctx.params.id;
  ctx.body = await service.getDashboardCommunityTaskMetrics(group, filter,communityId);
});

router.get('/api/admin/admin/:id', auth.isAdmin, async (ctx, next) => {
  var user = await service.getProfile(ctx.params.id);
  user.isAdmin = ctx.query.action === 'true' ? 't' : 'f';
  await service.updateProfile(user, function (error) {
    if (error) {
      log.info(error);
    }
    service.createAuditLog('ACCOUNT_PERMISSION_UPDATED', ctx, {
      userId: user.id,
      action: (ctx.query.action === 'true' ? 'Admin permission added' : 'Admin permission removed'),
      status: (error ? 'failed' : 'successful'),
    });
    ctx.body = { user };
  });
});

router.get('/api/admin/agencyAdmin/:id', auth, async (ctx, next) => {
  if (await service.canAdministerAccount(ctx.state.user, ctx.params.id)) {
    var user = await service.getProfile(ctx.params.id);
    user.isAgencyAdmin = ctx.query.action === 'true' ? 't' : 'f';
    await service.updateProfile(user, function (done, error) {
      if (error) {
        log.info(error);
      }
      service.createAuditLog('ACCOUNT_PERMISSION_UPDATED', ctx, {
        userId: user.id,
        action: (ctx.query.action === 'true' ? 'Agency admin permission added' : 'Agency admin permission removed'),
        status: (error ? 'failed' : 'successful'),
      });
      ctx.body = { user };
    });
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/communityAdmin/:id/:communityId', auth, async (ctx, next) => {
  if (await communityService.isCommunityManager(ctx.state.user, ctx.params.communityId)) {
    var user = await service.getProfile(ctx.params.id);
    user.isCommunityAdmin = ctx.query.action === 'true' ? true : false;
    await service.updateCommunityAdmin(user, ctx.params.communityId, function (done, error) {
      if (error) {
        log.info(error);
      }
      service.createAuditLog('ACCOUNT_PERMISSION_UPDATED', ctx, {
        userId: user.id,
        action: (ctx.query.action === 'true' ? 'Community admin permission added' : 'Community admin permission removed'),
        status: (error ? 'failed' : 'successful'),
      });
      ctx.body = { user };
    });
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/community/:communityId/member/:userId', auth, async (ctx, next) => {
  if (await communityService.isCommunityManager(ctx.state.user, ctx.params.communityId)) {
    await communityService.updateCommunityMembership(ctx.params, ctx.query.action, function (error) {
      service.createAuditLog('COMMUNITY_MEMBERSHIP_UPDATED', ctx, {
        userId: ctx.params.userId,
        communityId: ctx.params.communityId,
        action: (ctx.query.action === 'remove' ? 'Community member removed' : ctx.query.action === 'true' ? 'Community membership enabled' : 'Community membership disabled'),
        status: (error ? 'failed' : 'successful'),
      });
      ctx.status = error ? 400 : 200;
      ctx.body = { message: (error ? 'failed' : 'success') };
    });
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/changeOwner/:taskId', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if (ctx.state.user.isAdmin || await service.canAgencyChangeOwner(ctx.state.user, ctx.params.taskId)) {
    await service.getOwnerOptions(ctx.params.taskId, function (results, err) {
      if (err) {
        ctx.status = 400;
        ctx.body = err;
      } else {
        ctx.status = 200;
        ctx.body = results;
      }
    });
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/community/changeOwner/:taskId', auth, async (ctx, next) => {
  if (ctx.state.user.isAdmin || await service.canCommunityChangeOwner(ctx.state.user, ctx.params.taskId)) {
    await service.getCommunityOwnerOptions(ctx.params.taskId, function (results, err) {
      if (err) {
        ctx.status = 400;
        ctx.body = err;
      } else {
        ctx.status = 200;
        ctx.body = results;
      }
    });
  } else {
    ctx.status = 403;
  }
});

router.post('/api/admin/changeOwner', auth, async (ctx, next) => {
  if (ctx.state.user.isAdmin
    || await service.canAgencyChangeOwner(ctx.state.user, ctx.request.body.taskId)
    ||  await service.canCommunityChangeOwner(ctx.state.user, ctx.request.body.taskId)) {
    await service.changeOwner(ctx, ctx.request.body, processResult.bind(ctx));
  } else {
    ctx.status = 403;
  }
});

router.post('/api/admin/assign', auth.isAdmin, async (ctx, next) => {
  await service.assignParticipant(ctx, ctx.request.body, processResult.bind(ctx));
});

function processResult (result, err) {
  if (err) {
    this.status = 400;
    this.body = err;
  } else {
    this.status = 200;
    this.body = result;
  }
}

module.exports = router.routes();
