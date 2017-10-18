import feathers from './feathers';
import ProxyService from './proxy-service';
import Service from './service';

export default function createApplication (...args) {
  return feathers(...args);
}
export { ProxyService, Service };
Object.assign(createApplication, {
  version: require('../package.json').version
});
