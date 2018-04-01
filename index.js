require = require("esm")(module/*, options*/);
console.time('mostly-feathers import');
module.exports = require('./src/index');
console.timeEnd('mostly-feathers import');
