const chai = require('chai');
const chaiHttp = require('chai-http');

const options = {
  testSite: process.env.TestSite || 'https://openopps-staging.app.cloud.gov/',
};

const request = chai.use(chaiHttp).request(options.testSite);
const should = require('chai').should();

exports.options = options;
exports.chai = chai;
exports.should = should;
exports.request = request;