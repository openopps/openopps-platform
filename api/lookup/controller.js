const log = require('log')('app:lookup');
const Router = require('koa-router');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/lookup/:codeType', auth, async (ctx, next) => {
  ctx.body = await service.lookupCodesByCodeType(ctx.params.codeType);
});


module.exports = router.routes();
