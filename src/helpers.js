import fp from 'mostly-func';

export const defaultMethods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

export const idAction = (id, params) => {
  if (id === 'null') id = null;
  const action = params && (params.__action || (params.query && params.query.$action));
  // check if id is action name for find
  if (id && !action) {
    if (fp.isFunction(this[id]) && defaultMethods.indexOf(id) < 0) {
      return [null, id];
    }
  }
  return [id, action];
};