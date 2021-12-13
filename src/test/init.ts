import test from 'ava';

import { MockFs } from './mock-fs-helper';

test.serial.afterEach(() => {
  MockFs.restore();
  delete process.env.PG_CONNECTION_URI;
});

Error.stackTraceLimit = Number.POSITIVE_INFINITY;
