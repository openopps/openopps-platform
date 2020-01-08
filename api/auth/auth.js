const _ = require ('lodash');
const Audit = require('../model/Audit');
const db = require('../../db');
const dao = require('./dao')(db);
const passport = require('koa-passport');
const isCommunityManager = require('../community/service').isCommunityManager;
const isCommunityApprover = require('../community/service').isCommunityApprover;

function initializeAuditData (ctx) { 
  return {
    path: ctx.path,
    method: ctx.method,
    status: 'blocked',
  };
}

async function createAudit (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
}

async function forbidden (ctx) {
  await createAudit('FORBIDDEN_ACCESS', ctx, initializeAuditData(ctx));
  ctx.status = 403;
}

async function baseAuth (ctx, next) {
  if(ctx.isAuthenticated()) {
    await next();
  } else {
    await createAudit('UNAUTHENTICATED_ACCESS', ctx, initializeAuditData(ctx));
    ctx.body = { message: 'You must be logged in to view this page' };
    ctx.status = 401;
  }
}

module.exports = baseAuth;

module.exports.isAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAdmin ? await next() : await forbidden(ctx);
  });
};

module.exports.isApprover = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isApprover ? await next() : await forbidden(ctx);
  });
};

module.exports.isAdminOrApprover = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAdmin || ctx.state.user.isApprover ? await next() : await forbidden(ctx);
  });
};

module.exports.isAgencyAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAgencyAdmin ? await next() : await forbidden(ctx);
  });
};

module.exports.isAdminOrAgencyAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAdmin || ctx.state.user.isAgencyAdmin ? await next() : ctx.status = 403;
  });
};

module.exports.isCommunityAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    (await isCommunityManager(ctx.state.user, ctx.params.id)) ? await next() : ctx.status = 403;
  });
};

module.exports.isCommunityApprover = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    (await isCommunityApprover(ctx.state.user, ctx.params.id)) ? await next() : ctx.status = 403;
  });
};

module.exports.bearer = async (ctx, next) => {
  await passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err)
    {
      console.log(err);
      return next(err);
    }
    if (!user)
    {
      if (info != null) {
        console.log(info);
        ctx.body = { message: 'You must be logged in to view this page', info: info.message }
        return ctx;
      }
      ctx.status = 403;
      ctx.body = { message: 'You must be logged in to view this page' };
      return ctx;
    }
    await ctx.login(user);
    return await next();
  })(ctx, next);
};

module.exports.checkToken = async (ctx, next) => {
  // if access_token expires in the next 5 minutes request a new one
  var timeDifference = new Date(0).setUTCSeconds(ctx.state.user.tokenset.expires_at) - new Date().getTime()
  if(timeDifference < (1000 * 60 * 5)) {
    await openopps.auth.oidc.refresh(ctx.state.user.tokenset.refresh_token).then(async (tokenset) => {
      ctx.session.passport.user.tokenset = _.pick(tokenset, ['access_token', 'id_token', 'refresh_token', 'expires_at']);
      ctx.state.user.tokenset = _.pick(tokenset, ['access_token', 'id_token', 'refresh_token', 'expires_at']);
      await next();
    }).catch(async (err) => {
      await next();
    });
  } else {
    await next();
  }
};
