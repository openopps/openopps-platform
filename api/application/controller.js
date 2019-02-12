const log = require('log')('app:application');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/application/:id', auth, async (ctx, next) => {
  var application = await service.findById(ctx.params.id);
  ctx.status = application ? 200 : 404;
  ctx.body = application ? application : 'Not Found';
});

router.put('/api/application/:id', auth, async (ctx, next) => {
  var result = await service.updateApplication(ctx.state.user.id, ctx.params.id, ctx.request.body);
  if (result) {
    ctx.status = 200;
    ctx.body = result;
  } else {
    ctx.status = 400;
  }
});

router.get('/api/application/:userId/:communityId', auth, async (ctx, next) => {
});

router.post('/api/application/apply/:taskId', auth, async (ctx, next) => {
  if(ctx.state.user.hiringPath == 'student') {
    await service.apply(ctx.state.user.id, ctx.params.taskId, (err, applicationId) => {
      ctx.status = err ? 400 : 200;
      ctx.body = err ? err.message : applicationId;
    });
  } else {
    ctx.status = 400;
    ctx.body = 'You must be a student to apply for this internship';
  }
});

router.post('/api/application/:id/language', auth, async (ctx, next) =>{
  var result = await service.addLanguage(ctx.state.user.id, ctx.params.id, ctx.request.body);
  if (result) {
    ctx.status = result.err ? 409 : 200;
    ctx.body = result;
  } else {
    ctx.status = 400;
  }
});

router.post('/api/application/:applicationId/Education',auth, async (ctx,next) =>{
  ctx.request.body.userId = ctx.state.user.id;
  ctx.request.body.applicationId=ctx.params.applicationId;
  await service.saveEducation(ctx.request.body, function (errors,education)  {
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {     
      ctx.status = 200;
      ctx.body = education;
    }
  });
});

router.delete('/api/application/:id/Education/:educationId/',auth, async (ctx,next) =>{ 
  ctx.body = await service.deleteEducation(ctx.params.educationId);
});

router.get('/api/honors/',auth, async (ctx, next) => {
  ctx.body = await service.getHonors();
});
router.get('/api/degreeLevels/',auth, async (ctx, next) => {
  ctx.body = await service.getDegreeLevels();
});
module.exports = router.routes();