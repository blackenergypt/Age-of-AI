const protocol = require('./protocol');
const registry = require('./registry');

module.exports = {
  ...protocol,
  ...registry
};
