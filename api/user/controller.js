const log = require('blue-ox')('app:user');
const validator = require('validator');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/user/all', auth, async (ctx, next) => {
  ctx.body = await service.list();
});

router.get('/api/user', auth, async (ctx, next) => {
  ctx.body = ctx.state.user;
});

router.get('/api/user/:id', auth, async (ctx, next) => {
  if(ctx.params.id == ctx.state.user.id) {
    ctx.body = await service.populateBadgeDescriptions(ctx.state.user);
  } else {
    var profile = await service.getProfile(ctx.params.id);
    profile.canEditProfile = await service.canAdministerAccount(ctx.state.user, ctx.params);
    ctx.body = profile;
  }
});

router.get('/api/user/username/:username', async (ctx, next) => {
  if (!ctx.params.username) {
    return ctx.send(true);
  }
  log.info('looking up username', ctx.params.username);
  if (validator.isEmail(ctx.params.username) !== true) {
    return ctx.body = true;
  }
  await service.findOneByUsername(ctx.params.username.toLowerCase().trim(), function (err, user) {
    if (err) {
      ctx.status = 400;
      return ctx.body = { message:'Error looking up username.' };
    } else if (!user) {
      return ctx.body = false;
    } else {
      return ctx.body = true;
    }
  });
});

router.get('/api/user/activities/:id', auth, async (ctx, next) => {
  ctx.body = await service.getActivities(ctx.params.id);
});

router.get('/api/user/photo/:id', async (ctx, next) => {
  var user = await service.findOne(ctx.params.id);
  if (!user) {
    ctx.redirect('/images/default-user-icon-profile.png');
  }
  if (user.photoId) {
    ctx.status = 307;
    ctx.redirect('/api/upload/get/' + user.photoId);
  }
  else if (user.photoUrl) {
    ctx.status = 307;
    ctx.redirect(user.photoUrl);
  }
  else {
    ctx.status = 307;
    ctx.redirect('/images/default-user-icon-profile.png');
  }
});

router.post('/api/user/resetPassword', auth, async (ctx, next) => {
  if (await service.canAdministerAccount(ctx.state.user, ctx.request.body)) {
    ctx.body = await service.updatePassword(ctx.request.body);
  } else {
    ctx.status = 403;
  }
});

router.put('/api/user/:id', auth, async (ctx, next) => {
  if (await service.canUpdateProfile(ctx)) {
    ctx.status = 200;
    await service.updateProfile(ctx.request.body, function (errors, result) {
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      ctx.body = result;
    });
  } else {
    ctx.status = 403;
    ctx.body = { success: false };
  }
});

router.get('/api/user/disable/:id', auth, async (ctx, next) => {
  await service.updateProfileStatus({
    disable: true,
    user: ctx.state.user,
    id: ctx.params.id,
  }, (user, err) => {
    err ? err.message === 'Forbidden' ? ctx.status = 403 : ctx.status = 400 : ctx.body = { user };
  });
});

router.get('/api/user/enable/:id', auth, async (ctx, next) => {
  await service.updateProfileStatus({
    disable: false,
    user: ctx.state.user,
    id: ctx.params.id,
  }, (user, err) => {
    err ? err.message === 'Forbidden' ? ctx.status = 403 : ctx.status = 400 : ctx.body = { user };
  });
});

module.exports = router.routes();
