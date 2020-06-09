const log = require('log')('app:co-owner');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const elasticService = require('../../elastic/service');

var router = new Router();

router.get('/api/co-owner/:taskId', auth, async (ctx, next) => {
  await service.getCoOwners(ctx.params.taskId).then(results => {
    ctx.status = 200;
    ctx.body = results;
  }).catch(err => {
    log.error(err);
    ctx.status = 400;
    ctx.body = { message: 'Unexpected error was encounted trying to get co-owners.' };
  });
});

router.post('/api/co-owner', auth, service.canManageCoOwners, async (ctx, next) => {
  await service.addCoOwners(ctx,ctx.state.user.id, ctx.request.body.taskId, ctx.request.body.users).then(() => {
    ctx.status = 200;
  }).catch(err => {
    log.error(err);
    ctx.status = 400;
    ctx.body = { message: 'Unexpected error was encounted trying to add co-owners.' };
  });
});

router.delete('/api/co-owner/:coOwnerId', auth, service.canManageCoOwners, async (ctx, next) => {
  await service.deleteCoOwner(ctx.state.user.id, ctx.params.coOwnerId).then(() => {
    ctx.status = 200;
  }).catch(err => {
    log.error(err);
    ctx.status = 400;
    ctx.body = { message: 'Unexpected error was encounted trying to remove co-owner.' };
  });
});

router.post('/api/co-owner/primary', auth, service.canManageCoOwners, async (ctx, next) => {
  await service.changePrimaryCoOwner(ctx, ctx.request.body.taskId, ctx.request.body.coOwnerId).then(() => {
    elasticService.indexOpportunity(ctx.request.body.taskId);
    ctx.status = 200;
  }).catch(err => {
    log.error(err);
    ctx.status = 400;
    ctx.body = { message: 'Unexpected error was encounted trying to change the primary co-owner.' };
  });
});

module.exports = router.routes();