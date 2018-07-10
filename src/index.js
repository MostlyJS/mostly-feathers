const feathers = require('./feathers');
const ProxyService = require('./proxy-service');
const Service = require('./service');
const { defaultMethods, isAction } = require('./helpers');

const version = require('../package.json').version;

module.exports = function createApplication (...args) {
  return feathers(...args);
};

module.exports.ProxyService = ProxyService;
module.exports.Service = Service;
module.exports.version = version;
module.exports.defaultMethods = defaultMethods;
module.exports.isAction = isAction;
