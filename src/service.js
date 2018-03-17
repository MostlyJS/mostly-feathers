import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';

const debug = makeDebug('mostly:feathers:service');

const defaultMethods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

const defaultOptions = {
  name: 'service'
};

export default class Service {
  constructor (options) {
    this.options = Object.assign({}, defaultOptions, options);
    this.name = options.name;
  }

  setup(app) {
    this.app = app;
  }

  find (params) {
    params = fp.assign({ query: {} }, params);
    
    const action = params.__action || (params.query && params.query.$action);

    if (!action || action === 'find') {
      debug('service %s find %j', this.name, params.query);
      return this._find(params);
    }

    return this._action('find', action, null, null, params);
  }

  get (id, params) {
    params = fp.assign({ query: {} }, params);

    let action = params.__action || (params.query && params.query.$action);

    // check if id is action for find
    if (id && !action) {
      if (this['_' + id] && defaultMethods.indexOf(id) < 0) {
        params = fp.assoc('__action', id, params);
        return this.find(params);
      }
    }

    if (!action || action === 'get') {
      debug('service %s get %j', this.name, id, params);
      return this._get(id, params);
    }

    return this._action('get', action, id, null, params);
  }

  create (data, params) {
    params = fp.assign({ query: {} }, params);

    // add support to create multiple objects
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    const action = params.__action || (params.query && params.query.$action);
    if (!action || action === 'create') {
      debug('service %s create %j', this.name, data);
      return this._create(data, params);
    }

    // TODO secure action call by get
    return this._action('create', action, null, data, params);
  }

  update (id, data, params) {
    params = fp.assign({}, params);

    let action = params.__action || (params.query && params.query.$action);
    
    // check if id is action for patch
    if (id && !action) {
      if (this['_' + id] && defaultMethods.indexOf(id) < 0) {
        action = id;
        id = null;
      }
    }

    if (!action || action === 'update') {
      debug('service %s update %j', this.name, id, data);
      return this._update(id, data, params);
    }
    
    return this._action('update', action, id, data, params);
  }

  patch (id, data, params) {
    params = fp.assign({}, params);

    let action = params.__action || (params.query && params.query.$action);
    
    // check if id is action for patch
    if (id && !action) {
      if (this['_' + id] && defaultMethods.indexOf(id) < 0) {
        action = id;
        id = null;
      }
    }

    if (!action || action === 'patch') {
      return this._patch(id, data, params);
    }

    return this._action('patch', action, id, data, params);
  }

  remove (id, params) {
    params = fp.assign({}, params);

    const action = params.__action || (params.query && params.query.$action);
    if (!action || action === 'remove') {
      debug('service %s remove %j', this.name, id);
      return this._remove(id, params);
    }

    // TODO secure action call by get
    this._action('remove', action, id, null, params);
  }

  /**
   * proxy to action method
   * syntax sugar for calling from other services, do not call them by super
   */
  action (action) {
    return {
      find: (params = {}) => {
        params.__action = action;
        return this.find(params);
      },

      get: (id, params = {}) => {
        params.__action = action;
        return this.get(id, params);
      },

      create: (data, params = {}) => {
        params.__action = action;
        return this.create(data, params);
      },

      update: (id, data, params = {}) => {
        params.__action = action;
        return this.update(id, data, params);
      },

      patch: (id, data, params = {}) => {
        params.__action = action;
        return this.patch(id, data, params);
      },

      remove: (id, params = {}) => {
        params.__action = action;
        return this.remove(id, params);
      }
    };
  }

  /**
   * private actions, aciton method are pseudo private by underscore
   */

  _action (method, action, id, data, params) {
    if (this['_' + action] === undefined || defaultMethods.indexOf(action) >= 0) {
      throw new Error(`No such **${method}** action: ${action}`);
    }
    if (params.__action)
      params = fp.dissoc('__action', params);
    if (params.query && params.query.$action)
      params.query = fp.dissoc('$action', params.query);
    debug('service %s %s action %s id %j => %j', this.name, method, action, id, data);

    // get target item with params.query (without provider)
    let query = id
      ? this.get(id, { query: params.query || {} })
      : Promise.resolve(null);
    return query.then(origin => {
      if (id && !origin) {
        throw new Error('Not found record ' + id + ' in ' + this.Model.modelName);
      }
      return this['_' + action].call(this, id, data, params, origin);
    });
  }

  _find(params) { throw new Error('Not implemented'); }
  _get(id, params) { throw new Error('Not implemented'); }
  _create(data, params) { throw new Error('Not implemented');  }
  _update(id, data, params) { throw new Error('Not implemented'); }
  _patch(id, data, params) { throw new Error('Not implemented'); }
  _remove(id, params) { throw new Error('Not implemented'); }
}
