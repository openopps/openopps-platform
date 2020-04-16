const log = require('log')('app:admin');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../../auth/auth');
const service = require('./service');
const communityService = require('../../community/service');

var router = new Router();

router.get('/api/admin/export', auth.isAdmin, async (ctx, next) => {
  if(ctx.state.user.isAdmin) {
    await service.getExportData('user').then(results => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=users.csv');
      ctx.body = results;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Sitewide user data exported.',
      });
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

router.get('/api/admin/export/contributor/created', auth.isAdmin, async (ctx, next) => {
  var today= new Date();
  var fiscalYear= 'FY' + (today.getFullYear() + (today.getMonth() >= 9 ? 1 : 0)).toString().substr(2);
  if(ctx.state.user.isAdmin) {   
    await service.getExportData('TopContributor','created').then(results => {  
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=TopContributors_' + fiscalYear +'_Created.csv');
      ctx.body = results;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Top contributors opportunities created agency data exported.',
      });
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

router.get('/api/admin/export/contributor/participant', auth.isAdmin, async (ctx, next) => {
  var today= new Date();
  var fiscalYear= 'FY' + (today.getFullYear() + (today.getMonth() >= 9 ? 1 : 0)).toString().substr(2);
  if(ctx.state.user.isAdmin) {   
    await service.getExportData('TopContributor','participant').then(results => {  
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=TopContributors_' + fiscalYear +'_Participated.csv');
      ctx.body = results;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Top contributors participating in opportunities agency data exported.',
      });
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

router.get('/api/admin/export/agency/:id/contributor/created', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  var today = new Date();
  var fiscalYear = 'FY' + (today.getFullYear() + (today.getMonth() >= 9 ? 1 : 0)).toString().substr(2);
  var agency = await service.lookupAgency(ctx.params.id);
  if(ctx.state.user.isAdmin || ctx.state.user.agencyId == ctx.params.id) {
    await service.getExportData('TopContributor','agency-created',ctx.params.id).then(results => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=TopContributors_' + agency.name + '_' + fiscalYear +'_Created.csv');
      ctx.body = results;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Top agency contributors opportunities created data exported.',
      });
    }).catch(err => {
      log.error(err);
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

router.get('/api/admin/export/agency/:id', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if(ctx.state.user.isAdmin || ctx.state.user.agencyId == ctx.params.id) {
    await service.getExportData('user', 'agency', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=agency_users.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'User data exported for agency id ' + ctx.params.id,
      });
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
    await service.getExportData('user', 'community', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=community_users.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'User data exported for community ' + ctx.params.id,
      });
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

router.get('/api/admin/export/community/internships/:id/:cycleId', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    await service.getExportData('taskInteractions', 'communityCycleTask', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=community_internships.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Internships data exported for community ' + ctx.params.id,
      });
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
router.get('/api/admin/export/community/Interactions/:id/:cycleId', auth, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    await service.getExportData('taskInteractions', 'communityCycleInteractions', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=community_interactions.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Interactions data exported for community ' + ctx.params.id,
      });
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

router.get('/api/admin/task/export', auth.isAdmin, async (ctx, next) => {
  if(ctx.state.user.isAdmin) {
    var exportData = await service.getExportData('task', 'sitewide').then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=opportunities.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Sitewide task data exported.',
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

router.get('/api/admin/task/export/agency/:id', auth.isAdminOrAgencyAdmin, async (ctx, next) => {
  if(ctx.state.user.isAdmin || ctx.state.user.agencyId == ctx.params.id) {
    await service.getExportData('task', 'agency', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=agency_opportunities.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Task data exported for agency id ' + ctx.params.id,
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

router.get('/api/admin/task/export/community/:id', auth.isCommunityAdmin, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    await service.getExportData('task', 'community', ctx.params.id).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=community_opportunities.csv');
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

router.get('/api/admin/task/export/community/:id/cycle/:cycleId', auth.isCommunityAdmin, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    await service.getExportData('task', 'community', ctx.params.id, ctx.params.cycleId).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=community_internships.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Task data exported for community id ' + ctx.params.id + 'and cycle id ' + ctx.params.cycleId,
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

router.get('/api/admin/applicants/export/community/:id/cycle/:cycleId', auth.isCommunityAdmin, async (ctx, next) => {
  if(await communityService.isCommunityManager(ctx.state.user, ctx.params.id)) {
    await service.getExportData('cycleApplications', '', ctx.params.id, ctx.params.cycleId).then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=internship_applications.csv');
      ctx.body = rendered;
      service.createAuditLog('DATA_EXPORTED', ctx, {
        userId: ctx.state.user.id,
        action: 'Application data exported for community id ' + ctx.params.id + 'and cycle id ' + ctx.params.cycleId,
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