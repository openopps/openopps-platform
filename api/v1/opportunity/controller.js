const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/v1/task/internships', auth.bearer, async(ctx, next) => {
    var data = await service.getInternships(ctx.state.user.id, ctx.query.state); 
    ctx.body = data;
});

router.get('/api/v1/task/internshipSummary', auth.bearer, async(ctx, next) => {
    var data = await service.getInternshipSummary(ctx.state.user.id, ctx.query.taskId); 
    data.owners = await service.getTaskShareList(ctx.state.user.id, ctx.query.taskId);
    data.taskList = await service.getTaskList(ctx.state.user.id, ctx.query.taskId);
    ctx.body = data;
});

router.get('/api/v1/task/taskList', auth.bearer, async(ctx, next) => {
    var data = await service.getTaskList(ctx.query.taskId); 
    ctx.body = data;
});

router.post('/api/v1/task/share/:taskId/share/:uri', auth.bearer, async(ctx, next) => {
    var data = await service.getTaskList(ctx.query.taskId);
    ctx.body = data;
});

router.delete('/api/task/:taskId/share/:uri', auth.bearer, async(ctx, next) => {
    //ctx.params.id
    var data = await service.getTaskList(ctx.query.taskId);
    ctx.body = data;
});

module.exports = router.routes();