if (!global._babelPolyfill) { require('babel-polyfill'); }

import feathers from './feathers';

export default function createApplication (...args) {
  return feathers(...args);
}

Object.assign(createApplication, {
  version: require('../package.json').version
});
