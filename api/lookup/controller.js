const log = require('log')('app:lookup');
const Router = require('koa-router');
const auth = require('../auth/auth');
const service = require('./service');
const _ = require('lodash');

var router = new Router();

router.get('/api/lookup/:codeType', async (ctx, next) => {
  ctx.body = await service.lookupCodesByCodeType(ctx.params.codeType);
});

router.get('/api/lookup/application/enumerations', async (ctx, next) => { 
  var result =  {
    languageProficiencies: await service.lookupCodesByCodeType('languageProficiencies'),
    academicHonors: await service.lookupCodesByCodeType('academicHonors'),
    degreeTypes: await service.lookupCodesByCodeType('degreeTypes'),
    referenceTypes: await service.lookupCodesByCodeType('referenceTypes'),
    securityClearances: _.sortBy(await service.lookupCodesByCodeType('securityClearances'), 'code'),
  };
  
  ctx.body = result;
});

module.exports = router.routes();
