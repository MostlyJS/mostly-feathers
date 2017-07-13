import query from 'qs';
import makeDebug from 'debug';
import { stripSlashes } from 'feathers-commons';
import { convert } from 'feathers-errors';

const debug = makeDebug('mostly:feathers:default-service');

export default class DefaultService {
  constructor (settings) {
    this.id = settings.id || '_id';
    this.name = stripSlashes(settings.name);
    this.trans = settings.trans;
  }

  request(options) {
    return new Promise((resolve, reject) => {
      let pattern = {
        topic: `feathers.${this.name}`,
        cmd: options.method,
        args: options.args,
        params: options.params,
        path: '',
        feathers: {}
      };
      debug('default service request', pattern);
      this.trans.act(pattern, (err, data) => {
        debug(' => default service response:', err, data);
        if (err) return reject(err.cause || err);
        resolve(data);
      });
    });
  }

  find(params = {}, action) {
    if (action) params.__action = action;
    return this.request({
      method: 'find',
      args: [],
      params: params
    });
  }

  get(id, params = {}, action) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'get' can not be undefined`));
    }

    if (action) params.__action = action;
    return this.request({
      method: 'get',
      args: [id],
      params: params
    });
  }

  create(body, params = {}, action) {
    return this.request({
      method: 'create',
      args: [body],
      params: params
    });
  }

  update(id, body, params = {}, action) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'update' can not be undefined, only 'null' when updating multiple entries`));
    }

    if (action) params.__action = action;
    return this.request({
      method: 'update',
      args: [id, body],
      params: params
    });
  }

  patch(id, body, params = {}, action) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'patch' can not be undefined, only 'null' when updating multiple entries`));
    }

    if (action) params.__action = action;
    return this.request({
      method: 'patch',
      args: [id, body],
      params: params
    });
  }

  remove(id, params = {}, action) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'remove' can not be undefined, only 'null' when removing multiple entries`));
    }

    if (action) params.__action = action;
    return this.request({
      method: 'remove',
      args: [id],
      params: params
    });
  }

  count(params = {}) {
    return get(null, params, 'count');
  }

  first(params = {}) {
    return get(null, params, 'first');
  }

  last(params = {}) {
    return get(null, params, 'last');
  }

  restore(id, params = {}) {
    return remove(id, params, 'restore');
  }
}
