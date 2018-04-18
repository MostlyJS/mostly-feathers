import query from 'qs';
import makeDebug from 'debug';
import { stripSlashes } from 'feathers-commons';
import { convert } from 'feathers-errors';

const debug = makeDebug('mostly:feathers:proxy-service');

const defaultMethods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

export default class ProxyService {
  constructor (settings = { id: '_id'}) {
    this.id = settings.id || '_id';
    this.name = stripSlashes(settings.name);
    this.domain = stripSlashes(settings.domain || 'feathers');
    this.trans = settings.trans;
  }

  request (options = {}) {
    return new Promise((resolve, reject) => {
      let pattern = {
        topic: `${this.domain}.${this.name}`,
        cmd: options.method,
        args: options.args,
        params: options.params,
        path: '',
        feathers: {}
      };
      debug(`proxy service \'${pattern.topic}\' request`,
        pattern.cmd, JSON.stringify(pattern.params.query)
      );
      this.trans.act(pattern, (err, data) => {
        debug(` => proxy service \'${pattern.topic}\' response`, {
          error: err,
          size: data? JSON.stringify(data).length : 0
        });
        if (err) return reject(err.cause || err);
        resolve(data);
      });
    });
  }

  find (params = {}) {
    return this.request({
      method: 'find',
      args: [],
      params: params
    });
  }

  get (id, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'get' can not be undefined`));
    }

    return this.request({
      method: 'get',
      args: [id],
      params: params
    });
  }

  create (body, params = {}) {
    return this.request({
      method: 'create',
      args: [body],
      params: params
    });
  }

  update (id, body, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'update' can not be undefined, only 'null' when updating multiple entries`));
    }

    return this.request({
      method: 'update',
      args: [id, body],
      params: params
    });
  }

  patch (id, body, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'patch' can not be undefined, only 'null' when updating multiple entries`));
    }

    return this.request({
      method: 'patch',
      args: [id, body],
      params: params
    });
  }

  remove (id, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'remove' can not be undefined, only 'null' when removing multiple entries`));
    }

    return this.request({
      method: 'remove',
      args: [id],
      params: params
    });
  }

  /**
   * proxy to action method
   * syntax sugar for calling from other services
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
}
