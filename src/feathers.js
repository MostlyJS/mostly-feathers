import app from './application';

/**
 * Create a Feathers application.
 *
 * @return {Function}
 * @api public
 */
export default function createApplication(trans) {
  app.init(trans);
  return app;
}
