const _ = require ('lodash');
const Audit = require('../model/Audit');
const db = require('../../db');
const dao = require('./dao')(db);

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
    ctx.state.user.isCommunityAdmin ? await next() : await forbidden(ctx);
  });
};

module.exports.isAdminOrCommunityAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAdmin || ctx.state.user.isCommunityAdmin ? await next() : ctx.status = 403;
  });
};
