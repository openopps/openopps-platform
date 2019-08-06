const log = require('log')('app:opportunity');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const notification = require('../notification/service');
const badgeService = require('../badge/service')(notification);
const Badge = require('../model/Badge');
const elasticService = require('../../elastic/service');

var router = new Router();

router.get('/api/task', async (ctx, next) => {
  ctx.body = await service.list(ctx.state.user);
});

router.get('/api/task/remap', auth.isAdmin, async (ctx, next) => {
  var tasks = await elasticService.remapOpportunities();
  ctx.body = tasks.length;
});

router.get('/api/task/reindex', auth.isAdmin, async (ctx, next) => {
  var tasks = await elasticService.reindexOpportunities();
  ctx.body = tasks.length;
});

router.get('/api/task/search', async (ctx, next) => {
  var request = elasticService.convertQueryStringToOpportunitiesSearchRequest(ctx);
  var results = await elasticService.searchOpportunities(request);

  ctx.body = results;
});

router.get('/api/task/communities', auth, async (ctx, next) => {
  var data = await service.getCommunities(ctx.state.user.id); 
  ctx.body = data;
});

router.get('/api/task/saved', auth, async (ctx, next) => {
  ctx.body = await service.getSavedOpportunities(ctx.state.user);
});

router.get('/api/task/applicants/:id', auth, async (ctx, next) => {
  await service.getApplicantsForTask(ctx.state.user, ctx.params.id).then(results => {
    ctx.status = 200;
    ctx.body = results;
  }).catch(err => {
    ctx.status = err.status;
  })
});

router.get('/api/task/selections/:id', auth, async (ctx, next) => {
  if (await service.canUpdateOpportunity(ctx.state.user, ctx.params.id)) {
    await service.getSelectionsForTask(ctx.state.user, ctx.params.id).then(results => {
      ctx.status = 200;
      ctx.body = results;
    }).catch(err => {
      ctx.status = err.status;
    })
  } else {
    ctx.status = 403;
    ctx.body = null;
  }
});

router.get('/api/task/:id', async (ctx, next) => {
  var task = await service.findById(ctx.params.id, ctx.state.user);
  if (typeof ctx.state.user !== 'undefined' && ctx.state.user.id === task.userId) {
    task.isOwner = true;
  }
  if (task.isOwner || (ctx.state.user && await service.canUpdateOpportunity(ctx.state.user, ctx.params.id))) {
    task.canEditTask = true;
  }
  ctx.body = task;
});

router.get('/api/comment/findAllBytaskId/:id', async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    ctx.body = await service.commentsByTaskId(ctx.params.id);
  } else {
    ctx.body = { 'comments': [] };
  }
});

router.post('/api/task', auth, async (ctx, next) => {
  ctx.request.body.userId = ctx.state.user.id;
  ctx.request.body.updatedBy = ctx.state.user.id;
  ctx.request.body.agencyId = ctx.state.user.agencyId;
  
  await service.createOpportunity(ctx.request.body, function (errors, task) {
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {
      service.sendTaskStateUpdateNotification(task.owner, task);
      ctx.status = 200;
      ctx.body = task;
    }
  });
});

router.post('/api/task/save', auth, async (ctx, next) => {
  await service.saveOpportunity(ctx.state.user, ctx.request.body, function (error) {
    ctx.status = error ? 400 : 200;
    ctx.body = error || { success: true };
  });
});

router.put('/api/task/state/:id', auth, async (ctx, next) => {
  if (await service.canUpdateOpportunity(ctx.state.user, ctx.request.body.id)) {
    ctx.request.body.updatedBy = ctx.state.user.id; 
    await service.updateOpportunityState(ctx.request.body, function (task, stateChange, errors) {
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      try {
        checkTaskState(stateChange, task.owner, task);
      } finally {
        ctx.body = { success: true };
      }
    });
  } else {
    ctx.status = 403;
    ctx.body = null;
  }
});

router.put('/api/task/:id', auth, async (ctx, next) => {
  if (await service.canUpdateOpportunity(ctx.state.user, ctx.request.body.id)) {
    ctx.request.body.updatedBy = ctx.state.user.id;
    await service.updateOpportunity(ctx.request.body, function (task, stateChange, errors) {
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      try {
        awardBadge(task);
        checkTaskState(stateChange, task.owner, task);
      } finally {
        ctx.status = 200;
        ctx.body = { success: true };
      }
    });
  } else {
    ctx.status = 401;
    ctx.body = null;
  }
});

router.put('/api/publishTask/:id', auth, async (ctx, next) => {
  if (await service.canAdministerTask(ctx.state.user, ctx.request.body.id)) {
    ctx.request.body.updatedBy = ctx.state.user.id;
    await service.publishTask(ctx.request.body, function (done) {
      ctx.body = { success: true };
    }).catch(err => {
      log.info(err);
    });
  }
});

router.put('/api/task/internship/complete/:id', auth, async (ctx, next) => {
  if (await service.canAdministerTask(ctx.state.user, ctx.request.body.id)) {
    ctx.request.body.updatedBy = ctx.state.user.id;
    await service.completedInternship(ctx.request.body, function (done) {
      ctx.body = { success: true };
    }).catch(err => {
      log.info(err);
    });
  }
});

router.post('/api/task/copy', auth, async (ctx, next) => {
  ctx.request.body.updatedBy = ctx.state.user.id;
  await service.copyOpportunity(ctx.request.body, ctx.state.user, function (error, task) {
    if (error) {
      ctx.flash('error', 'Error Copying Opportunity');
      ctx.status = 400;
      log.info(error);
      return ctx.body = null;
    }
    ctx.body = task;
  });
});

function awardBadge (task) {
  var badge = Badge.awardForTaskPublish(task, task.userId);
  if(badge) {
    badgeService.save(badge).catch(err => {
      log.info('Error saving badge', badge, err);
    });
  }
}

function checkTaskState (stateChange, user, task) {
  if (stateChange) {
    service.sendTaskStateUpdateNotification(user, task);
    if(task.state === 'completed') {
      service.volunteersCompleted(task);
    }
  }
}

router.delete('/api/task/:id', auth, async (ctx) => {
  if (await service.canAdministerTask(ctx.state.user, ctx.params.id)) {
    await service.findOne(ctx.params.id).then(async task => {
      if (['draft', 'submitted'].indexOf(task.state) != -1) {
        ctx.body = await service.deleteTask(ctx.params.id);
      } else if (task.state == 'open' && task.cycleId) {
        ctx.body = await service.deleteTask(ctx.params.id, task.cycleId);	
      } else {
        log.info('Wrong state');
        ctx.status = 400;
      }
    }).catch(err => {
      log.info('Error occured', err);
      ctx.status = 400;
    });
  } else {
    ctx.status = 403;
  }
});

module.exports = router.routes();
