const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/v1/application', auth.bearer, async(ctx, next) => {
    var data = await service.getApplicationSummary(ctx.query.applicationId); 
    ctx.body = data;
});

module.exports = router.routes();