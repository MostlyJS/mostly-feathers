import feathers from './feathers';
import ProxyService from './proxy-service';
import Service from './service';
import { defaultMethods, isAction } from './helpers';

const version = require('../package.json').version;

export default function createApplication (...args) {
  return feathers(...args);
}

export { ProxyService, Service, version, defaultMethods, isAction };
