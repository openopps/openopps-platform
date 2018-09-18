const log = require('log')('app:admin');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

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
  var exportData = await service.getExportData().then(rendered => {
    ctx.response.set('Content-Type', 'text/csv');
    ctx.response.set('Content-disposition', 'attachment; filename=users.csv');
    ctx.body = rendered;
  }).catch(err => {
    log.info(err);
  });
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

router.get('/api/admin/admin/:id', auth.isAdmin, async (ctx, next) => {
  var user = await service.getProfile(ctx.params.id);
  user.isAdmin = ctx.query.action === 'true' ? 't' : 'f';
  await service.updateProfile(user, function (error) {
    if (error) {
      log.info(error);
    }
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
      ctx.body = { user };
    });
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/users/*', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if (!ctx.query.q) {
    ctx.body = await service.getUsersForAgency(ctx.query.page, ctx.query.limit, ctx.params[0]);
  } else {
    ctx.body = await service.getUsersForAgencyFiltered(ctx.query.page || 1, ctx.query.q, ctx.params[0]);
  }
});

router.get('/api/admin/tasks/*', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  ctx.body = await service.getAgencyTaskStateMetrics(ctx.params[0]);
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

router.post('/api/admin/changeOwner', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if (ctx.state.user.isAdmin || await service.canChangeOwner(ctx.state.user, ctx.request.body.taskId)) {
    await service.changeOwner(ctx, ctx.request.body, function (result, err) {
      if (err) {
        ctx.status = 400;
        ctx.body = err;
      } else {
        ctx.status = 200;
        ctx.body = result;
      }
    });
  } else {
    ctx.status = 403;
  }
});

router.post('/api/admin/assign', auth.isAdmin, async (ctx, next) => {
  await service.assignParticipant(ctx, ctx.request.body, function (result, err) {
    if (err) {
      ctx.status = 400;
      ctx.body = err;
    } else {
      ctx.status = 200;
      ctx.body = result;
    }
  });
});

module.exports = router.routes();
