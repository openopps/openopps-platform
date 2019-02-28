const Router = require('koa-router');
const auth = require('../../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/v1/task/internships', auth.bearer, async(ctx, next) => {
    ctx.cacheControl = openopps.cache.noStore;
    var data = await service.getInternships(ctx.state.user.id, ctx.query.state); 
    ctx.body = data;
});

router.get('/api/v1/task/internshipSummary', auth.bearer, async(ctx, next) => {
    ctx.cacheControl = openopps.cache.noStore;
    var data = await service.getInternshipSummary(ctx.state.user.id, ctx.query.taskId); 
    data.owners = await service.getTaskShareList(ctx.state.user.id, ctx.query.taskId);
    data.taskList = await service.getTaskList(ctx.state.user.id, ctx.query.taskId);
    ctx.body = data;
});

router.get('/api/v1/task/taskList', auth.bearer, async(ctx, next) => {
    ctx.cacheControl = openopps.cache.noStore;
    var data = await service.getTaskList(ctx.query.taskId); 
    ctx.body = data;
});

router.post('/api/v1/task/:taskId/share', auth.bearer, async(ctx, next) => {
    // 1. is this person a member of a community?
    //   if they are, we can add them
    // 2. make sure we handle any edge cases
    ctx.cacheControl = openopps.cache.noStore;
    var data = await service.getTaskList(ctx.params.taskId, ctx.request.fields.email);
    ctx.body = data;
});

router.delete('/api/task/:taskId/share/:uri', auth.bearer, async(ctx, next) => {
    //ctx.params.id
    ctx.cacheControl = openopps.cache.noStore;
    var data = await service.getTaskList(ctx.query.taskId);
    ctx.body = data;
});

module.exports = router.routes();