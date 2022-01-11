import { TestFn } from 'ava';
import MockDate from 'mockdate';

import { MockFs } from './helpers/mock-fs.js';

/**
 * This function is for bootstrapping where ever `test.serial.afterEach` is needed for
 * restoring MockFs and more. Used to be loaded from ava require config before esm update,
 * but current that method does not work. Maybe in the future this could be removed.
 */
export const serialAfterEach = (test: TestFn) => {
  test.serial.afterEach(() => {
    MockFs.restore();
    delete process.env.PG_CONNECTION_URI;
  });
};

Error.stackTraceLimit = Number.POSITIVE_INFINITY;
MockDate.set('2000-01-01');
