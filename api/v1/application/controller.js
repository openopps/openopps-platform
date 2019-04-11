const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');
const oppService = require('../opportunity/service');
var _ = require('lodash')

var router = new Router();

router.get('/api/v1/application', auth.bearer, async (ctx, next) => {
  var data = await service.getApplicationSummary(ctx.query.taskListApplicationId, ctx.state.user.jwt_payload.sub, ctx.state.user.jwt_payload.auth_time);
  ctx.body = data;
});

router.post('/api/v1/application/removeApplicationTask', auth.bearer, async(ctx, next) => {
    var owners = await oppService.getTaskShareList(ctx.request.fields.taskId);
    var owner = _.find(owners, function(owner) {
        return owner.user_id == ctx.state.user.id;
    });
    if (owner)
    {
        var data = await service.removeApplicationTask(ctx.request.fields.applicationTaskId, ctx.request.fields.taskListApplicationId, ctx.state.user);
        if(!data){
            ctx.status = 401;
            ctx.body = { err: 'There was an error removing the applicant.'};
        }
        else{
            ctx.status = 200;
            ctx.body = data;
        }
    }
    else {
        ctx.status = 401;
        ctx.body = { err: 'Not authorized '};
    }
});

router.post('/api/v1/application/updateLastContacted', auth.bearer, async (ctx, next) => {
  var data = await service.updateLastContacted(ctx.request.fields.emails);
  ctx.body = data;
});

module.exports = router.routes();