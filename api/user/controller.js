const log = require('log')('app:user');
const validator = require('validator');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const documentService = require('../document/service');
const validGovtEmail = require('../model').ValidGovtEmail;
const syncProfile = require('../auth/syncProfile');

var router = new Router();

router.get('/api/user/all', auth, async (ctx, next) => {
  ctx.body = await service.list();
});

router.get('/api/user', async (ctx, next) => {
  if(ctx.state.user) {
    var tokenSet = {
      access_token: ctx.state.user.access_token,
      id_token: ctx.state.user.id_token,
    };
    await syncProfile(ctx.state.user, tokenSet, (err, user) => {
      ctx.body = (err ? null : user);
    });
  } else {
    ctx.body = null;
  }
});

router.get('/api/user/:id', auth, async (ctx, next) => {
  if(ctx.params.id == ctx.state.user.id) {
    ctx.body = await service.populateBadgeDescriptions(ctx.state.user);
  } else {
    var profile = await service.getProfile(ctx.params.id);
    if(profile) {
      profile.canEditProfile = await service.canAdministerAccount(ctx.state.user, ctx.params);
      ctx.body = profile;
    } else {
      ctx.status = 404;
    }
  }
});

router.get('/api/user/username/:username', async (ctx, next) => {
  if (!ctx.params.username || !validator.isEmail(ctx.params.username) || !validGovtEmail(ctx.params.username)) {
    return ctx.body = true;
  }
  log.info('looking up username', ctx.params.username);
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

router.post('/api/user/photo/remove/:id', async (ctx, next) => {
  if (await service.canUpdateProfile(ctx)) {
    //ctx.status = 200;
    await documentService.removeFile(ctx.state.user.photoId).then(async (result) => {
      if(!result) {
        return ctx.status = 404;
      }
      await service.updatePhotoId(ctx.params.id);
      ctx.body = { success: true };
    });
  } else {
    ctx.status = 403;
    ctx.body = { success: false };
  }
});

router.post('/api/user/resetPassword', auth, async (ctx, next) => {
  if (await service.canAdministerAccount(ctx.state.user, ctx.request.body)) {
    ctx.body = await service.updatePassword(ctx.request.body);
  } else {
    ctx.status = 403;
  }
});

router.put('/api/user/skills/:id', auth, async (ctx, next) => {
  if (await service.canUpdateProfile(ctx)) {
    ctx.status = 200;
    await service.updateSkills(ctx.request.body, async (errors, result) => {
      await service.createAudit('ACCOUNT_UPDATED', ctx, { 
        userId: ctx.request.body.id,
        section: 'skills',
        status: errors ? 'failed' : 'successful',
      });
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      ctx.body = result;
    });
  } else {
    await service.createAudit('UNAUTHORIZED_ACCOUNT_UPDATED', ctx, { userId: ctx.request.body.id });
    ctx.status = 403;
    ctx.body = { success: false };
  }
});

router.put('/api/user/:id', auth, async (ctx, next) => {
  if (await service.canUpdateProfile(ctx)) {
    ctx.status = 200;
    await service.updateProfile(ctx.request.body, async (errors, result) => {
      await service.createAudit('ACCOUNT_UPDATED', ctx, { 
        userId: ctx.request.body.id,
        section: 'profile',
        status: errors ? 'failed' : 'successful',
      });
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      ctx.body = result;
    });
  } else {
    await service.createAudit('UNAUTHORIZED_ACCOUNT_UPDATED', ctx, { userId: ctx.request.body.id });
    ctx.status = 403;
    ctx.body = { success: false };
  }
});

router.get('/api/user/disable/:id', auth, async (ctx, next) => {
  await service.updateProfileStatus(ctx, {
    disable: true,
    user: ctx.state.user,
    id: ctx.params.id,
  }, (user, err) => {
    err ? err.message === 'Forbidden' ? ctx.status = 403 : ctx.status = 400 : ctx.body = { user };
  });
});

router.get('/api/user/enable/:id', auth, async (ctx, next) => {
  await service.updateProfileStatus(ctx, {
    disable: false,
    user: ctx.state.user,
    id: ctx.params.id,
  }, (user, err) => {
    err ? err.message === 'Forbidden' ? ctx.status = 403 : ctx.status = 400 : ctx.body = { user };
  });
});

module.exports = router.routes();
