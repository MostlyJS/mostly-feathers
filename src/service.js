import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';
import { defaultMethods, isAction } from './helpers';

const debug = makeDebug('mostly:feathers:service');

const defaultOptions = {
  name: 'service'
};

export default class Service {
  constructor (options) {
    this.options = fp.assignAll(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
  }

  find (params) {
    params = { query: {}, ...params };

    debug('service %s find %j', this.name, params.query);
    return this._find(params);
  }

  get (id, params) {
    params = { query: {}, ...params };

    if (this._isAction(id, params)) {
      return this._action('get', id, null, params);
    }
    debug('service %s get %j', this.name, id, params);
    return this._get(id, params);
  }

  create (data, params) {
    params = { query: {}, ...params };

    // add support to create multiple objects
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    debug('service %s create %j', this.name, data);
    return this._create(data, params);
  }

  update (id, data, params) {
    params = { query: {}, ...params };

    if (this._isAction(id, params)) {
      return this._action('update', id, data, params);
    }
    debug('service %s update %j', this.name, id, data);
    return this._update(id, data, params);
  }

  patch (id, data, params) {
    params = { query: {}, ...params };

    if (this._isAction(id, params)) {
      return this._action('patch', id, data, params);
    }
    debug('service %s patch %j', this.name, id, data);
    return this._patch(id, data, params);
  }

  remove (id, params) {
    params = { query: {}, ...params };

    if (this._isAction(id, params)) {
      return this._action('remove', id, null, params);
    }
    debug('service %s remove %j', this.name, id);
    return this._remove(id, params);
  }

  /**
   * proxy to action method
   * syntax sugar for calling from other services, do not call them by super
   */
  action (action) {
    assert(action, 'action is not provided');
    return {
      get: async (params = {}) => {
        params.action = action;
        return this.get(null, params);
      },

      create: async (data, params = {}) => {
        params.action = action;
        return this.patch(null, data, params);
      },

      update: async (id, data, params = {}) => {
        params.action = action;
        return this.update(id, data, params);
      },

      patch: async (id, data, params = {}) => {
        params.action = action;
        return this.patch(id, data, params);
      },

      remove: async (id, params = {}) => {
        params.action = action;
        return this.remove(id, params);
      }
    };
  }

  /**
   * check if name is a service method
   */
  _isAction (id, params) {
    return isAction(this, id, params);
  }

  /**
   * Proxy to a action service
   */
  async _action (method, id, data, params) {
    const action = params && (params.action || (params.query && params.query.$action)) || id;
    assert(action, 'action is not provided');

    if (!fp.isFunction(this[action]) || defaultMethods.indexOf(action) >= 0) {
      throw new Error(`Not implemented **${method}** action: ${action}`);
    }
    params = fp.dissoc('action', fp.dissocPath(['query', '$action'], params));
    debug('service %s %s action %s id %j => %j', this.name, method, action, id, data);

    switch (method) {
      case 'get': return this[action].call(this, params);
      case 'create': return this[action].call(this, null, data, params);
      case 'update': return this[action].call(this, id, data, params);
      case 'patch': return this[action].call(this, id, data, params);
      case 'remove': return this[action].call(this, id, params);
      default: throw new Error(`Invalid method ${method}`);
    }
  }

  _find (params) { throw new Error('Not implemented'); }
  _get (id, params) { throw new Error('Not implemented'); }
  _create (data, params) { throw new Error('Not implemented');  }
  _update (id, data, params) { throw new Error('Not implemented'); }
  _patch (id, data, params) { throw new Error('Not implemented'); }
  _remove (id, params) { throw new Error('Not implemented'); }
}
