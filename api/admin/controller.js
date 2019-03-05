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

router.get('/api/admin/interactions', auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getInteractions();
});

router.get('/api/admin/taskmetrics', auth.isAdmin, async (ctx, next) => {
  var group = ctx.query.group;
  var filter = ctx.query.filter;
  ctx.body = await service.getDashboardTaskMetrics(group, filter);
});

router.get('/api/admin/export', auth.isAdmin, async (ctx, next) => {
  await service.getExportData().then(results => {
    ctx.response.set('Content-Type', 'text/csv');
    ctx.response.set('Content-disposition', 'attachment; filename=users.csv');
    ctx.body = results;
  }).catch(err => {
    log.info(err);
    ctx.status = 500;
  });
});

router.get('/api/admin/export/agency/:id', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if(ctx.state.user.agencyId == ctx.params.id) {
    await service.getExportData('agency', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=agency-users.csv');
      ctx.body = rendered;
    }).catch(err => {
      log.info(err);
      ctx.status = 500;
    });
  } else {
    service.createAuditLog('FORBIDDEN_ACCESS', ctx, {
      userId: user.id,
      path: ctx.path,
      method: ctx.method,
      status: 'blocked',
    });
    ctx.status = 403;
  }
});

router.get('/api/admin/export/community/:id', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    await service.getExportData('community', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=community-users.csv');
      ctx.body = rendered;
    }).catch(err => {
      log.info(err);
      ctx.status = 500;
    });
  } else {
    service.createAuditLog('FORBIDDEN_ACCESS', ctx, {
      userId: user.id,
      path: ctx.path,
      method: ctx.method,
      status: 'blocked',
    });
    ctx.status = 403;
  }
});

router.get('/api/admin/users', auth.isAdmin, async (ctx, next) => {
  if (!ctx.query.q) {
    ctx.body = await service.getUsers(ctx.query.page, ctx.query.limit);
  } else {
    ctx.body = await service.getUsersFiltered(ctx.query.page || 1, ctx.query.q);
  }
});

router.get('/api/admin/tasks', auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getTaskStateMetrics();
});

router.get('/api/admin/agencies', auth.isAdmin, async (ctx, next) => {
  ctx.body = await service.getAgencies();
});

router.get('/api/admin/agency/:id', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  ctx.body = await service.getAgency(ctx.params.id);
});

router.get('/api/admin/agency/:id/users', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if (!ctx.query.q) {
    ctx.body = await service.getUsersForAgency(ctx.query.page, ctx.query.limit, ctx.params.id);
  } else {
    ctx.body = await service.getUsersForAgencyFiltered(ctx.query.page || 1, ctx.query.q, ctx.params.id);
  }
});

router.get('/api/admin/agency/:id/tasks', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  ctx.body = await service.getAgencyTaskStateMetrics(ctx.params.id);
});

router.get('/api/admin/community/:id/tasks', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    ctx.body = await service.getCommunityTaskStateMetrics(ctx.params.id);
  } else {
    ctx.status = 403;
  }
});

router.get('/api/admin/communities', auth.isAdminOrCommunityAdmin, async (ctx, next) => {
  ctx.body = await service.getCommunities(ctx.state.user);
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

router.get('/api/admin/community/:id/users', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    if (!ctx.query.q) {
      ctx.body = await service.getUsersForCommunity(ctx.query.page, ctx.query.limit, ctx.params.id);
    } else {
      ctx.body = await service.getUsersForCommunityFiltered(ctx.query.page || 1, ctx.query.q, ctx.params.id);
    }
  } else {
    ctx.status = 403;
  }
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

router.get('/api/admin/changeOwner/:taskId', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if (ctx.state.user.isAdmin || await service.canChangeOwner(ctx.state.user, ctx.params.taskId)) {
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
    || await service.canChangeOwner(ctx.state.user, ctx.request.body.taskId)
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
