import makeDebug from 'debug';
import { stripSlashes } from 'feathers-commons';
import Uberproto from 'uberproto';
import mixins from './mixins/index';

const debug = makeDebug('mostly:feathers:application');
const methods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

const Proto = Uberproto.extend({
  create: null
});

export default {
  init (trans) {
    Object.assign(this, {
      trans,
      methods,
      mixins: mixins(),
      services: {},
      _setup: false
    });
  },

  service (location, service, options = {}) {
    location = stripSlashes(location);

    if (!service) {
      const current = this.services[location];

      if (typeof current === 'undefined' && typeof this.defaultService === 'function') {
        return this.service(location, this.defaultService(location), options);
      }

      return current;
    }

    let protoService = Proto.extend(service);

    debug(`Registering new service at \`${location}\``);

    // Add all the mixins
    this.mixins.forEach(fn => fn.call(this, protoService));

    if (typeof protoService._setup === 'function') {
      protoService._setup(this, location);
    }

    // Register the service
    this.methods.forEach(method => {
      this.trans.add({
        topic: `feathers.${location}`,
        cmd: method
      }, function (req, cb) {
        debug(`service called ${req.topic}->${req.cmd} with ${req.args}, %j`, req.params);
        protoService[req.cmd]
          .apply(protoService, req.args.concat([req.params]))
          .then(data => cb(null, data))
          .catch(cb);
      });
    });

    // If we ran setup already, set this service up explicitly
    if (this._isSetup && typeof protoService.setup === 'function') {
      debug(`Setting up service for \`${location}\``);
      protoService.setup(this, location);
    }

    return (this.services[location] = protoService);
  },

  use (location) {
    let service;
    let middleware = Array.from(arguments)
      .slice(1)
      .reduce(function (middleware, arg) {
        if (typeof arg === 'function') {
          middleware[service ? 'after' : 'before'].push(arg);
        } else if (!service) {
          service = arg;
        } else {
          throw new Error('invalid arg passed to app.use');
        }
        return middleware;
      }, {
        before: [],
        after: []
      });

    const hasMethod = methods => methods.some(name =>
      (service && typeof service[name] === 'function')
    );

    // Check for service (any object with at least one service method)
    if (hasMethod(['handle', 'set']) || !hasMethod(this.methods.concat('setup'))) {
      return this._super.apply(this, arguments);
    }

    // Any arguments left over are other middleware that we want to pass to the providers
    this.service(location, service, { middleware });

    return this;
  },

  setup () {
    // Setup each service (pass the app so that they can look up other services etc.)
    Object.keys(this.services).forEach(path => {
      const service = this.services[path];

      debug(`Setting up service for \`${path}\``);
      if (typeof service.setup === 'function') {
        service.setup(this, path);
      }
    });

    this._isSetup = true;

    return this;
  },

  configure (fn) {
    fn.call(this);

    return this;
  }

};
