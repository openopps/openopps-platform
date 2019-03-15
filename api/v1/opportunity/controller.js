const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');
var _ = require('lodash');

var router = new Router();

router.get('/api/v1/task/internships', auth.bearer, async(ctx, next) => {
    var data = await service.getInternships(ctx.state.user.id, ctx.query.state); 
    ctx.body = data;
});

router.get('/api/v1/task/internshipSummary', auth.bearer, async(ctx, next) => {
    var data = await service.getInternshipSummary(ctx.query.taskId); 
    data.owners = await service.getTaskShareList(ctx.query.taskId);
    var owner = _.find(data.owners, function(owner) {
        return owner.user_id == ctx.state.user.id;
    });
    if (owner)
    {
        ctx.status = 200;
        data.taskList = await service.getTaskList(ctx.state.user.id, ctx.query.taskId);
        data.owners = _.filter(data.owners, function(owner) {
            return owner.user_id != ctx.state.user.id;
        });
        ctx.body = data;
    }
    else {
        ctx.status = 401;
        ctx.body = { err: 'Not authorized '};
    }   
});

router.get('/api/v1/task/taskList', auth.bearer, async(ctx, next) => {     
    var owners = await service.getTaskShareList(ctx.query.taskId);
    var owner = _.find(owners, function(owner) {
        return owner.user_id == ctx.state.user.id;
    });
    if (owner)
    {
        var data = await service.getTaskList(ctx.query.taskId);
        ctx.status = 200;
        ctx.body = data;
    }
    else {
        ctx.status = 401;
        ctx.body = { err: 'Not authorized '};
    }
});

router.post('/api/v1/task/:taskId/share', auth.bearer, async(ctx, next) => {
    // 1. is this person a member of a community?
    //   if they are, we can add them
    // 2. make sure we handle any edge cases
    var owners = await service.getTaskShareList(ctx.query.taskId);
    var owner = _.find(owners, function(owner) {
        return owner.user_id == ctx.state.user.id;
    });
    if (owner)
    {
        var data = await service.getTaskList(ctx.params.taskId, ctx.request.fields.email);
        ctx.status = 200;
        ctx.body = data;
    }
    else {
        ctx.status = 401;
        ctx.body = { err: 'Not authorized '};
    }   
    ctx.body = data;
});

router.put('/api/v1/taskList', auth.bearer, async(ctx, next) => {
    var data = await service.updateTaskList(ctx.state.user.id, ctx.request.fields);
    ctx.body = data;
});

router.delete('/api/task/:taskId/share/:uri', auth.bearer, async(ctx, next) => {
    //ctx.params.id
    var data = await service.getTaskList(ctx.query.taskId);
    ctx.body = data;
});

module.exports = router.routes();