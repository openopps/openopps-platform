const log = require('log')('app:document');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const userService = require('../user/service');

var router = new Router();

router.get('/api/document/image/:id', async (ctx, next) => {
  await service.findImage(ctx.params.id).then(result => {
    ctx.type = result.contentType;
    ctx.body = result.body;
  }).catch(err => {
    ctx.status = 404;
  });
});

router.get('/api/upload/get/:id', async (ctx, next) => {
  var result = await service.findOne(ctx.params.id);
  if(result) {
    ctx.type = result.contentType;
    ctx.body = result.body;
  } else {
    ctx.status = 404;
  }
});

router.post('/api/upload/create', auth, async (ctx, next) => {
  await service.upload(ctx.state.user.id, ctx.request.body).then(results => {
    ctx.status = results[0] ? 200 : 400;
    ctx.body = results[0] ? results[0] : 'An unexpected error occured trying to process your upload.';
  }).catch((err) => {
    ctx.status = 400;
    ctx.body = err.message;
  });
});

router.get('/api/attachment/findAllBytaskId/:id', async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    await service.taskAttachments(ctx.params.id).then((results) => {
      ctx.body = results;
    }).catch((err) => {
      ctx.status = 400;
    });
  } else {
    ctx.body = [];
  }
});

module.exports = router.routes();
