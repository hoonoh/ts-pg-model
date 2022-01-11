import { resolve } from 'path';

export default function factory({ projectDir }) {
  return {
    extensions: { ts: 'module' },
    nodeArguments: [
      //
      '--loader=ts-node/esm',
      '--experimental-specifier-resolution=node',
    ],
    files: ['src/**/*.spec.ts'],
    snapshotDir: resolve('./src/test/snapshots'),
    require: ['ts-node/register/transpile-only', './src/test/init.ts'],
  };
}
