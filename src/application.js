import makeDebug from 'debug';
import { stripSlashes } from 'feathers-commons';
import Uberproto from 'uberproto';
import util from 'util';
import route from './route';
import mixins from './mixins/index';
import DefaultService from './service';
const debug = makeDebug('mostly:feathers:application');
const methods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

const Proto = Uberproto.extend({
  create: null
});

// Adapts an express style handler to uroute
function adapt(fn) {
  return function adapter(ctx){
    return Promise.resolve(fn(ctx, ctx.response, ctx.next)).then(x => {
      return x === undefined && fn.length < 3 ? false : x;
    });
  };
}

// simplified version of `extend` that does not do deep cloning, but does
// accept an optional array of key names to skip as it's first argument.
function extend() {
  var args = [].splice.call(arguments, []), except, out = args.shift();
  if (Array.isArray(out)) {
    except = out;
    out = args.shift();
  }
  for (var i=0,src; i<args.length; i++) {
    src = args[i];
    if (src !== undefined && src !== null) {
      for (var key in src) {
        if (Array.isArray(except) && except.indexOf(key) !== -1) continue;
        out[key] = src[key];
      }
    }
  }
  return out;
}

export default {
  init(trans) {
    Object.assign(this, {
      trans,
      methods,
      mixins: mixins(),
      mountpath: '/',
      routes: route('/', []),
      services: {},
      settings: {},
      _setup: false
    });
  },

  get(name) {
    return this.settings[name];
  },

  set(name, value) {
    this.settings[name] = value;
    return this;
  },

  disable(name) {
    this.settings[name] = false;
    return this;
  },

  disabled(name) {
    return !this.settings[name];
  },

  enable(name) {
    this.settings[name] = true;
    return this;
  },

  enabled(name) {
    return !!this.settings[name];
  },

  service(location, service, options = {}) {
    location = stripSlashes(location);

    if (!service) {
      const current = this.services[location];

      if (typeof current === 'undefined') {
        let defaultService = new DefaultService({
          name: location,
          trans: this.trans
        });

        return (this.services[location] = defaultService);
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
      }, (req, cb) => {
        debug(`service \'${service}\' called`);
        debug(` => topic  \'${req.topic}\'`);
        debug(` => cmd  \'${req.cmd}\'`);
        debug(` => path \'${req.path}\'`);
        debug(` => args %j`, req.args);
        debug(` => params %j`, req.params);

        route.match(this.routes, extend(['host'],
          { path: '', feathers: {} }, req, { response: null }));
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

  use(location) {
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

    const handler = (path, fn) => {
      if (!fn) {
        fn = path;
        path = undefined;
        if (!fn) return;
      }
      if (fn.routes) {  // fn is a sub-app
        if (!path) path = '/';
        fn.mountpath = path;
        fn.parent = this;
        this.routes.children.push(route(path, { __handler: fn }, fn.routes.children));
        fn.emit('mount', this);
      } else {
        if (!path) path = fn.length >= 3 ? '*' : '/';
        this.routes.children.push(route(path, { __handler: fn }, adapt(fn)));
      }
    };

    // Check for service (any object with at least one service method)
    if (hasMethod(['handle', 'set']) || !hasMethod(this.methods.concat('setup'))) {
      debug('middleware handler', arguments);
      return handler.apply(this, arguments);
    }

    // Any arguments left over are other middleware that we want to pass to the providers
    this.service(location, service, { middleware });

    return this;
  },

  setup() {
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

  configure(fn) {
    fn && fn.call(this, this);
    return this;
  },

  start() {
    this.setup();
    debug('Mostly-feathers microservice application started');
    return this;
  }
};
