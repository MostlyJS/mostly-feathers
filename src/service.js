import query from 'qs';
import makeDebug from 'debug';
import { stripSlashes } from 'feathers-commons';
import { convert } from 'feathers-errors';

const debug = makeDebug('mostly:feathers:default-service');

export default class DefaultService {
  constructor (settings) {
    this.name = stripSlashes(settings.name);
    this.options = settings.options;
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
      debug('service request', pattern);
      this.trans.act(pattern, (err, data) => {
        debug(' ==> service response:', err, data);
        if (err) return reject(err.cause || err);
        resolve(data);
      });
    });
  }

  find(params = {}) {
    return this.request({
      method: 'find',
      args: [],
      params: params
    });
  }

  get(id, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'get' can not be undefined`));
    }

    return this.request({
      method: 'get',
      args: [id],
      params: params
    });
  }

  create(body, params = {}) {
    return this.request({
      method: 'create',
      args: [body],
      params: params
    });
  }

  update(id, body, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'update' can not be undefined, only 'null' when updating multiple entries`));
    }

    return this.request({
      method: 'update',
      args: [id, body],
      params: params
    });
  }

  patch(id, body, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'patch' can not be undefined, only 'null' when updating multiple entries`));
    }

    return this.request({
      method: 'patch',
      args: [id, body],
      params: params
    });
  }

  remove(id, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'remove' can not be undefined, only 'null' when removing multiple entries`));
    }

    return this.request({
      method: 'remove',
      args: [id],
      params: params
    });
  }
}
