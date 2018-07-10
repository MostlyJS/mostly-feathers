const promise = require('./promise');
const event = require('./event');
const normalizer = require('./normalizer');

module.exports = function () {
  const mixins = [promise, event, normalizer];

  // Override push to make sure that normalize is always the last
  mixins.push = function () {
    const args = [this.length - 1, 0].concat(Array.from(arguments));
    this.splice.apply(this, args);
    return this.length;
  };

  return mixins;
};