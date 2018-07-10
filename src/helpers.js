const fp = require('mostly-func');

const defaultMethods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

/**
 * check if name is a service method
 */
const isAction = (service, name, params) => {
  const action = params && (params.action || (params.query && params.query.$action)) || name;
  return (fp.isFunction(service[action]) && defaultMethods.indexOf(action) < 0);
};

module.exports = {
  defaultMethods,
  isAction
};
