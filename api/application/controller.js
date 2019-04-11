const log = require('log')('app:application');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/application/user/transcripts', auth, async (ctx, next) => {
  await service.getTranscripts(ctx.state.user).then(transcripts => {
    ctx.status = 200;
    ctx.body = transcripts;
  }).catch(err => {
    ctx.status = 404;
  });
});

router.get('/api/application/:id', auth, async (ctx, next) => {
  await service.findById(ctx.state.user.id, ctx.params.id).then(async application => {
    await service.getTranscripts(ctx.state.user).then(transcripts => {
      application.transcripts = transcripts;
      ctx.status = 200;
      ctx.body = application;
    }).catch(() => {
      ctx.status = 404;
    });
  }).catch(() => {
    ctx.status = 404;
  });
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

router.delete('/api/application/:id', auth, async (ctx, next) => {
  await service.deleteApplication(ctx.state.user.id, ctx.params.id, (err) => {
    ctx.status = err ? 400 : 200;
    ctx.body = err ? err.message : 'success';
  });
});

router.post('/api/application/apply/:taskId', auth, async (ctx, next) => {
  if(ctx.state.user.hiringPath == 'student') {
    await service.apply(ctx.state.user, ctx.params.taskId, (ctx.request.body || {}).getTasks, (err, results) => {
      ctx.status = err ? 400 : 200;
      ctx.body = err ? err : results;
    });
  } else {
    ctx.status = 400;
    ctx.body = 'You must be a student to apply for this internship';
  }
});

router.put('/api/application/:applicationId/task/swap', auth, async (ctx, next) => {
  await service.swapApplicationTasks(ctx.state.user.id, ctx.params.applicationId, ctx.request.body).then((results) => {
    ctx.status = 200;
    ctx.body = results;
  }).catch((err) => {
    ctx.status = err.status;
    ctx.body = err.message;
  });
});

router.delete('/api/application/:applicationId/task/:taskId', auth, async (ctx, next) => {
  await service.deleteApplicationTask(ctx.state.user.id, ctx.params.applicationId, ctx.params.taskId).then((result) => {
    ctx.status = 200;
    ctx.body = result;
  }).catch((err) => {
    ctx.status = err.status;
    ctx.body = err.message;
  });
});

router.post('/api/application/:applicationId/language', auth, async (ctx, next) =>{
  var result = await service.saveLanguage(ctx.state.user.id, ctx.request.body);
  if (result) {
    ctx.status = result.err ? 409 : 200;
    ctx.body = result;
  } else {
    ctx.status = 400;
  }
});

router.put('/api/application/:applicationId/language', auth, async (ctx, next) => {
  var result = await service.updateLanguage(ctx.state.user.id, ctx.request.body);
  if (result) {
    ctx.status = 200;
    ctx.body = result;
  } else {
    ctx.status = 400;
  }
});

router.delete('/api/application/:applicationId/applicationLanguageSkill/:applicationLanguageSkillId',auth, async (ctx,next) =>{ 
  var result = await service.deleteLanguage(ctx.state.user.id, ctx.params.applicationLanguageSkillId).then(() => {
    ctx.body = result;
    ctx.status = 200;
  }).catch((err) => {
    ctx.status = err.status;
    ctx.body = err.message;
  });
});

router.put('/api/application/:applicationId/skill', auth, async (ctx, next) =>{
  var result = await service.saveSkill(ctx.state.user.id, ctx.params.applicationId, ctx.request.body);
  if (result) {
    ctx.status = result.err ? 409 : 200;
    ctx.body = result;
  } else {
    ctx.status = 400;
  }
});

router.put('/api/application/:applicationId/Education',auth, async (ctx,next) =>{
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

router.get('/api/application/:id/Education/:educationId/', auth, async (ctx, next) => {
  var result = await service.getEducation(ctx.params.educationId);
  if (result) {
    ctx.status = 200;
    ctx.body = result;
  } else {
    ctx.status = 400;
  }
});

router.delete('/api/application/:id/Education/:educationId/',auth, async (ctx,next) =>{ 
  ctx.body = await service.deleteEducation(ctx.params.educationId);
});

router.post('/api/application/:applicationId/experience',auth, async (ctx,next) =>{
  ctx.request.body.userId = ctx.state.user.id;
  ctx.request.body.applicationId=ctx.params.applicationId;
  await service.saveExperience(ctx.request.body, function (errors,experience)  {
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {     
      ctx.status = 200;
      ctx.body = experience;
    }
  });
});

router.put('/api/application/:applicationId/experience/:experienceId', auth, async (ctx,next) => {
  ctx.request.body.userId = ctx.state.user.id;
  ctx.request.body.applicationId=ctx.params.applicationId;
  ctx.request.body.experienceId = ctx.params.experienceId;
  await service.saveExperience(ctx.request.body, function (errors,experience)  {
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {     
      ctx.status = 200;
      ctx.body = experience;
    }
  });
});

router.delete('/api/application/:id/experience/:experienceId',auth, async (ctx,next) =>{ 
  ctx.body = await service.deleteExperience(ctx.params.experienceId);
});

router.post('/api/application/:applicationId/reference',auth, async (ctx,next) =>{
  ctx.request.body.userId = ctx.state.user.id;
  ctx.request.body.applicationId=ctx.params.applicationId;
  await service.saveReference(ctx.request.body, function (errors,reference)  {
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {     
      ctx.status = 200;
      ctx.body = reference;
    }
  });
});

router.put('/api/application/:applicationId/reference/:referenceId', auth, async (ctx,next) => {
  ctx.request.body.userId = ctx.state.user.id;
  ctx.request.body.applicationId=ctx.params.applicationId;
  ctx.request.body.referenceId = ctx.params.referenceId;
  await service.saveReference(ctx.request.body, function (errors,reference)  {
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {     
      ctx.status = 200;
      ctx.body = reference;
    }
  });
});

router.delete('/api/application/:id/reference/:referenceId',auth, async (ctx,next) =>{ 
  ctx.body = await service.deleteReference(ctx.params.referenceId, ctx.state.user.id);
});

module.exports = router.routes();