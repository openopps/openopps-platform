const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');
var _ = require('lodash');

var router = new Router();

// if (process.env.HOST == 'openopps.test.usajobs.gov' || typeof process.env.HOST == 'undefined')
// {
    router.post('/api/v1/faker/fakedata', auth.bearer, async(ctx, next) => {
        ctx.body = await service.generateFakeData(ctx.request.fields);

    });
// }

router.delete('/api/v1/faker/fakedata', auth.bearer, async(ctx, next) => {
    ctx.body = await service.deleteFakeData(ctx.request.fields);
});

router.delete('/api/v1/faker/resetboard/:taskId', auth.bearer, async(ctx, next) => {
    ctx.body = await service.deleteBoardData(ctx.params.taskId);
});

module.exports = router.routes();