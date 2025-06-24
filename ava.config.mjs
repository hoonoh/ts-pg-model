import { resolve } from 'path';

export default function factory({ projectDir }) {
  process.env.TSIMP_DIAG = 'ignore';
  return {
    extensions: { ts: 'module' },
    nodeArguments: [
      //
      '--import=tsimp',
    ],
    files: ['src/**/*.spec.ts'],
    snapshotDir: resolve('./src/test/snapshots'),
    require: ['./src/test/init.ts'],
    timeout: '30s',
  };
}
