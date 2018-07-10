const app = require('./application');

/**
 * Create a Feathers application.
 *
 * @return {Function}
 * @api public
 */
module.exports = function createApplication (trans, domain) {
  app.init(trans, domain);
  return app;
};
