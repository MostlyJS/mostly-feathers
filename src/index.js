import feathers from './feathers';
import DefaultService from './service';

export default function createApplication (...args) {
  return feathers(...args);
}
export { DefaultService };
Object.assign(createApplication, {
  version: require('../package.json').version
});
