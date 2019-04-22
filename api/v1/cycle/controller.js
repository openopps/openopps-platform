const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');
var _ = require('lodash');

var router = new Router();

router.post('/api/v1/cycle/drawMany', auth.bearer, async (ctx, next) => {
    var data = await service.drawMany(ctx.state.user.id, ctx.request.fields.cycleId);
    ctx.body = data;
});

router.post('/api/v1/cycle/drawOne', auth.bearer, async (ctx, next) => {
    var data = await service.drawOne(ctx.state.user.id, ctx.request.fields.taskId);
    ctx.body = data.rows[0];
});

module.exports = router.routes();