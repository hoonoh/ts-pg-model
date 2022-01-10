import test from 'ava';
import MockDate from 'mockdate';

import { MockFs } from './helpers/mock-fs';

test.serial.afterEach(() => {
  MockFs.restore();
  delete process.env.PG_CONNECTION_URI;
});

Error.stackTraceLimit = Number.POSITIVE_INFINITY;
MockDate.set('2000-01-01');
