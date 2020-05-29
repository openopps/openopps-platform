const log = require('log')('app:comment');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const opportunityService = require('../opportunity/service');

var router = new Router();

router.get('/api/comment/task/:id', auth, async (ctx, next) => {
  ctx.body = await service.commentsForTask(ctx.params.id);
});

router.post('/api/comment', auth, async (ctx, next) => {
  var attributes = ctx.request.body;
  _.extend(attributes, { userId: ctx.state.user.id, topic: _.isNil(attributes.parentId) } );
  await service.addComment(attributes).then(results => {
    service.sendCommentNotification(ctx.state.user, results.rows[0]);
    ctx.body = results.rows[0];
  }).catch(err => {
    log.error(err);
    ctx.status = 400;
    ctx.body = { message: 'An unexpected error was encountered.'};
  });
});

router.put('/api/comment/:id', auth, async (ctx, next) => {
  var attributes = ctx.request.body;
  attributes.id= ctx.params.id;
  attributes.updatedAt = new Date();
  await service.updateComment(ctx,attributes, async (errors, result) => {    
    if (errors) {
      ctx.status = 400;
      ctx.body = errors;
    } else {     
      ctx.status = 200;
      ctx.body = result;
    }
  }); 
});

router.get('/api/comment/:commentId', auth, async (ctx, next) => {
  var result = await service.findById(ctx.params.commentId);
  if (result) {
    ctx.status = 200;
    ctx.body = result;
  } else {
    ctx.status = 400;
  }
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
        (ctx.state.user.agencyId == task.agencyId))) {
      ctx.body = await service.deleteComment(ctx.params.id);
    } else {
      ctx.status = 403;
    }
  }
  
});

module.exports = router.routes();
