const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');
var _ = require('lodash');

var router = new Router();
var Handler = {};

router.get('/api/v1/cycle/getPhaseData', auth.bearer, async (ctx, next) => {
  var data = await service.getPhaseData(ctx.query.cycleID);
  ctx.body = data;
});

router.post('/api/v1/cycle/beginPhase', auth.bearer, async (ctx, next) => {
  Handler[ctx.request.fields.action](ctx).then(async results => {
    service.createAuditLog('PHASE_STARTED', ctx, {
      cycleId: ctx.request.fields.cycleId,
      results: results,
    });
  }).catch(err => {
    if (err.length > 1) {
      err = err[0];
    } else if (err.stack) {
      err = err.stack;
    }
    service.recordError(ctx.state.user.id, err);
  });
  ctx.status = 202;
  ctx.body = { message: 'Acknowledged' };
});

Handler.startPrimaryPhase = async function (ctx) {
  await service.startPhaseProcessing(ctx.request.fields.cycleId);
  return new Promise((resolve, reject) => {
    drawMany(ctx).then(results => {
      resolve(results);
    }).catch(err => {
      reject(err);
    });
  });
};

Handler.startAlternatePhase = async function (ctx) {
  //TO DO 
  return true;
};


async function drawMany (ctx) {
  return new Promise((resolve, reject) => {
    service.drawMany(ctx.state.user.id, ctx.request.fields.cycleId).then(async results => {
      var phaseId = await service.updatePhaseForCycle(ctx.request.fields.cycleId);   
      results.phaseId = phaseId;
      resolve(results);
    }).catch(err => {
      reject(err);
    });
  });
}

// Keeping this around for right now.
router.post('/api/v1/cycle/drawMany', auth.bearer, async (ctx, next) => {
  await service.drawMany(ctx.state.user.id, ctx.request.fields.cycleId).then(async results => {
    await service.updatePhaseForCycle(ctx.request.fields.cycleId, ctx.request.fields.phaseId);
    ctx.status = 200;       
    ctx.body = results;
  }).catch(err => {
    ctx.status = err.status;
  });   
});

router.post('/api/v1/cycle/drawOne', auth.bearer, async (ctx, next) => {
  var data = await service.drawOne(ctx.state.user.id, ctx.request.fields.taskId);
  ctx.body = data.rows[0];
});

router.get('/api/v1/cycle/getCommunityUsers', auth.bearer, async (ctx, next) => {
  var data = await service.getCommunityUsers(ctx.query.cycleID);
  ctx.body = data;
});

module.exports = router.routes();