import app from './application';

/**
 * Create a Feathers application.
 *
 * @return {Function}
 * @api public
 */
export default function createApplication (trans, domain) {
  app.init(trans, domain);
  return app;
}
