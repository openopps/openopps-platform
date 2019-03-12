const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/v1/user/preferences', auth.bearer, async(ctx, next) => {
    var data = await service.getUserPreferences(ctx.state.user.id); 
    ctx.body = data;
});

module.exports = router.routes();