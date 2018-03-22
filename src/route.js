import makeDebug from 'debug';
import pathToRegExp from 'path-to-regexp';

const debug = makeDebug('mostly:feathers:route');

function route () {
  var args = Array.prototype.slice.call(arguments),
    next = args.shift(),
    path, ctx = {}, action, children;

  if (typeof next == 'string' || next instanceof String) {
    path = next.toString();
    next = args.shift();
  }
  if (typeof next == 'object' && (!Array.isArray(next))) {
    ctx = next;
    next = args.shift();
  }
  if (typeof next == 'function') {
    action = next;
    next = args.shift();
  }
  if (typeof next == 'object' && (Array.isArray(next))) {
    children = next;
    next = null;
  } else if (next) {
    children = [next];
  }
  if (args.length) {
    children = (children || []).concat(args);
  }
  var result = path? extend({}, ctx, {path:path}) : extend({}, ctx);
  if (!result.path) {
    result.path = '/';
  }
  if (typeof action == 'function') {
    result.action = action;
  } else if (children) {
    result.action = function next (ctx) {
      return ctx.next();
    };
  }
  if (typeof children == 'object') {
    result.children = children;
  }
  return result;
}

function match (routes, ctx) {
  debug('match', ctx.path);
  var context = typeof ctx === 'string' || ctx instanceof String ? {path: ctx} : ctx;
  var root = Array.isArray(routes) ? { path: '/', children: routes } : routes;
  var errorRoute = root.children && root.children.filter(x => x.path === '/error')[0];
  var match = matchRoute(root, '', context.path);
  var result, value, done = false;

  context.next = function () {
    var promise = Promise.resolve();
    var next = match.next();
    value = next.value;
    done = next.done;
    if (!done && value && value.route.action) {
      var newCtx = extend({}, context, next.value);
      try {
        promise = Promise.resolve(value.route.action(newCtx, newCtx.params));
      } catch(err) {
        promise = Promise.reject(err);
      }
      if (errorRoute) {
        promise = promise.catch(err => {
          err.status = err.status || 500;
          newCtx.error = err;
          return errorRoute.action(newCtx, newCtx.params);
        });
      }
    }
    return promise;
  };

  context.end = function (data) {
    result = data;
    done = true;
  };

  function run () {
    return context.next().then(function (r){
      if (r !== undefined) {
        result = r;
        done = true;
      }
      if (done) return result;
      return run();
    });
  }

  return run().then(function (r){
    if (r === undefined && errorRoute) {
      context.error = new Error('Not found');
      context.error.status = 404;
      return errorRoute.action(context, {});
    }
    return r;
  });
}


function matchRoute (route, baseUrl, path) {
  var match, childMatches, childIdx = 0;
  // simulate a generator function by returning an object with a `next` method
  return {
    next: function (){
      if (!route.children) {
        if (! match) {
          match = matchPath(true, route.path, path);
          if (match) {
            return {
              done: false,
              value: {
                route:route,
                baseUrl:baseUrl,
                path: match.path,
                params: match.params
              }
            };
          }
        }
        return { done: true, value: undefined };
      }

      if (route.children) {
        if (!match) {
          match = matchPath(false, route.path, path);
          if (match) {
            return {
              done: false,
              value: {
                route:route,
                baseUrl:baseUrl,
                path: match.path,
                params: match.params,
              }
            };
          }
        }
        while (childIdx < route.children.length) {
          if (!childMatches) {
            var childRoute = route.children[childIdx];
            var newPath = path.substr(match.path.length);
            childMatches = matchRoute(childRoute,
              baseUrl + (match.path === '/' ? '' : match.path),
              newPath.indexOf('/') === 0 ? newPath : '/' + newPath
            );
          }
          var childMatch = childMatches.next();
          if (childMatch.done) {
            childIdx++;
            childMatches = null;
          }
          else {
            return {
              done: false,
              value: childMatch.value
            };
          }
        }
        return { done: true, value: undefined };
      }
    }
  };
}


function matchPath (end, routePath, urlPath) {
  var key = routePath + '|' + end;
  var regexp = cache[key];
  if (!regexp) {
    var keys = [];
    regexp = { pattern: pathToRegExp(routePath, keys, { end:end }), keys:keys };
    cache[key] = regexp;
  }
  var m = regexp.pattern.exec(urlPath);
  if (!m) return null;
  var params = {}, path = m.shift();
  for (var i = 0; i < m.length; i++) {
    params[regexp.keys[i].name] = m[i] !== undefined? decode(m[i]) : undefined;
  }
  return { path: path === '' ? '/' : path, params:params };
}


function decode (val) {
  return typeof val !== 'string' ? val : decodeURIComponent(val);
}


function extend (out) {
  for (var src, i=1; i<arguments.length; i++) {
    if ((src = arguments[i]) !== undefined && src !== null) {
      for (var key in src) {
        out[key] = src[key];
      }
    }
  }
  return out;
}

var cache = {};

route.route = route;
route.match = match;
route.match.matchRoute = matchRoute;
route.match.matchPath = matchPath;
module.exports = route;
