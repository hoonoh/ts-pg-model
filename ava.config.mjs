import { resolve } from 'path';

export default ({ projectDir }) => {
  return {
    extensions: ['ts'],
    require: ['ts-node/register/transpile-only'],
    files: ['src/**/*.spec.ts'],
    snapshotDir: resolve('./src/test/snapshots'),
    require: ['ts-node/register', './src/test/init.ts'],
  };
};
