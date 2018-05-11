import fp from 'mostly-func';

export const defaultMethods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

/**
 * check if name is a service method
 */
export const isAction = (service, name, params) => {
  const action = params && (params.action || (params.query && params.query.$action)) || name;
  return (fp.isFunction(service[action]) && defaultMethods.indexOf(action) < 0);
};
