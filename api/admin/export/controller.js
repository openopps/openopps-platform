const log = require('log')('app:admin');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../../auth/auth');
const service = require('./service');
const communityService = require('../../community/service');

var router = new Router();

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
    if(ctx.state.user.isAdmin || ctx.state.user.agencyId == ctx.params.id) {
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
        userId: ctx.state.user.id,
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
        userId: ctx.state.user.id,
        path: ctx.path,
        method: ctx.method,
        status: 'blocked',
      });
      ctx.status = 403;
    }
  });

router.get('/api/admin/task/export/community/:id', auth.isAdmin, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    await service.getExportTaskCommunityData(ctx.state.user, ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=community-tasks.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Task data exported for community id ' + ctx.params.id,
      });
    }).catch(err => {
      log.info(err);
    });
  } else {
    service.createAuditLog('FORBIDDEN_ACCESS', ctx, {
      userId: ctx.state.user.id,
      path: ctx.path,
      method: ctx.method,
      status: 'blocked',
    });
    ctx.status = 403;
  }
});

module.exports = router.routes();