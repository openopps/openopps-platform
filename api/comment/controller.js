const log = require('log')('app:comment');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const opportunityService = require('../opportunity/service');

var router = new Router();

router.post('/api/comment', auth, async (ctx, next) => {
  var attributes = ctx.request.body;
  _.extend(attributes, { userId: ctx.state.user.id } );
  await service.addComment(attributes, function (errors, comment) {
    if (errors) {
      ctx.status = 400;
      return ctx.body = errors;
    }
    service.sendCommentNotification(ctx.state.user, comment, 'comment.create.owner');
    ctx.body = comment;
  });
});

router.delete('/api/comment/:id', auth, async (ctx) => {
  var comment = await service.findById(ctx.params.id);
  var task = (comment ? await opportunityService.findById(comment.taskId) : null);
  if (!comment || !task) {
    ctx.status = 400;
  } else {
    if (comment.userId === ctx.state.user.id || task.owner.id === ctx.state.user.id ||
      (_.has(ctx.state.user, 'isAdmin') && ctx.state.user.isAdmin) ||
      ((_.has(ctx.state.user, 'isAgencyAdmin') && ctx.state.user.isAgencyAdmin) &&
        (ctx.state.user.tags && (_.find(ctx.state.user.tags, { 'type': 'agency' }) || {}).name == task.owner.agency.name))) {
      ctx.body = await service.deleteComment(ctx.params.id);
    } else {
      ctx.status = 403;
    }
  }
  
});

module.exports = router.routes();
