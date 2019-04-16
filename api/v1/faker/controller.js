const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');
var _ = require('lodash');

var router = new Router();

if (_.indexOf(['DEV', 'TEST', 'LOCAL'], process.env.APP_ENV) > -1) {
    router.post('/api/v1/faker/fakedata', auth.bearer, async(ctx, next) => {
        ctx.body = await service.generateFakeData(ctx.state.user, ctx.request.fields);
    });

    router.delete('/api/v1/faker/fakedata/:cycleId', auth.bearer, async(ctx, next) => {
        ctx.body = await service.deleteFakeData(ctx.params);
    });

    router.delete('/api/v1/faker/resetboard/:taskId', auth.bearer, async(ctx, next) => {
        ctx.body = await service.deleteBoardData(ctx.params.taskId);
    });
}

module.exports = router.routes();