import feathers from './feathers';
import ProxyService from './proxy-service';
import Service from './service';

const version = require('../package.json').version;

export default function createApplication (...args) {
  return feathers(...args);
};

export { ProxyService, Service, version };
