const { resolve } = require('path');

module.exports = ({ projectDir }) => {
  return {
    extensions: ['ts'],
    require: ['ts-node/register/transpile-only'],
    files: ['src/**/*.spec.ts'],
    snapshotDir: resolve(__dirname, './src/test/snapshots'),
    require: ['ts-node/register', './src/test/init.ts'],
  };
};
