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
    var owner = await service.getTaskShareList(ctx.query.taskId, ctx.state.user.id);
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
    var owner = await service.getTaskShareList(ctx.params.taskId, ctx.state.user.id);
    if (owner)
    {
        var account = await service.getCommunityUserByTaskAndEmail(ctx.params.taskId, ctx.request.fields.email);
        if (account.length == 1)
        {
            var data = await service.addTaskOwner(ctx.params.taskId, account[0].id, owner[0].user_id, ctx.state.user);
            if (data == null) {
                ctx.body = { 'message':'The user associated with this email is already an owner of this board' };
                ctx.status = 409;
            } else {
                ctx.status = 200;
                var shared = await service.getTaskShareList(data.taskId, data.userId);
                return ctx.body = shared[0];
            }
        } else if (owner.length > 1) {
            ctx.status = 409;
            ctx.body = { 'message': 'Unable to add owner to board due to more than one record found' };
        } else {
            ctx.status = 404;
        }
    } else {
        ctx.status = 400;
    }
});

router.put('/api/v1/taskList', auth.bearer, async(ctx, next) => {
    var data = await service.updateTaskList(ctx.state.user, ctx.request.fields);
    ctx.body = data;
});

router.delete('/api/v1/task/:taskId/unshare/:userId', auth.bearer, async(ctx, next) => {
    if (ctx.params.userId == 0)
    {
        ctx.params.userId = ctx.state.user.id;
    }
    var data = await service.removeTaskOwner(ctx.state.user.id, ctx.params);
    ctx.status = 200;
    ctx.body = data;
});

module.exports = router.routes();