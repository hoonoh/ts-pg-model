import test from 'ava';

import { connectionURI } from '../../test/constants';
import { MockFs } from '../../test/mock-fs-helper';
import { TitleHelper } from '../../test/title-helper';
import { validateUserConfig } from '.';

const titleHelper = new TitleHelper();

const dotEnvPath = '/foo/bar/.env';

//
// connection
//
titleHelper.group('connection');

test.serial(titleHelper.should('parse dotEnv file'), async t => {
  MockFs.mockString({
    [dotEnvPath]: `PG_CONNECTION_URI=${connectionURI}`,
  });
  const p = validateUserConfig({
    dotEnvPath,
  });
  t.notThrowsAsync(p);
  t.is((await p).connectionURI, connectionURI);
});

test.serial(titleHelper.throwsWhen('dotEnv PG_CONNECTION_URI is invalid'), async t => {
  MockFs.mockString({
    [dotEnvPath]: `PG_CONNECTION_URI=invalid`,
  });
  await t.throwsAsync(validateUserConfig({ dotEnvPath }));
});

test(titleHelper.throwsWhen('dotEnv file not found'), async t => {
  await t.throwsAsync(validateUserConfig({ dotEnvPath }));
});

test(titleHelper.throwsWhen('uri is invalid'), async t => {
  await t.throwsAsync(validateUserConfig({ connectionURI: `${connectionURI}FooBar` }));
});

test(titleHelper.throwsWhen('connectionURI is invalid'), async t => {
  await t.throwsAsync(validateUserConfig({ connectionURI: `invalid` as `postgres://${string}` }));
});

titleHelper.ungroup();
//
// schema
//
titleHelper.group('schema');

test(titleHelper.should('load default schemas'), async t => {
  const res = await validateUserConfig({
    connectionURI,
  });
  t.deepEqual(res.schemas, ['public']);
  t.deepEqual(Object.keys(res.renderTargets), ['public']);
});

test(titleHelper.should('return expected schema'), async t => {
  const schema = 'users';
  const res = await validateUserConfig({
    connectionURI,
    schemas: [schema],
  });
  t.deepEqual(res.schemas, [schema]);
  t.deepEqual(Object.keys(res.renderTargets), [schema]);
});

test(titleHelper.throwsWhen('invalid schema is given'), async t => {
  const invalidSchema = 'fooBar';
  const error = await t.throwsAsync(
    validateUserConfig({
      connectionURI,
      schemas: [`${invalidSchema}`],
    }),
  );
  t.is(error.message, `invalid schema name: "${invalidSchema}"`);
});

titleHelper.ungroup();
//
// snapshot
//
titleHelper.group('snapshot');

test(titleHelper.should('validate `UserConfig` and return expected `Config`'), async t => {
  const res = await validateUserConfig({
    connectionURI,
    schemas: ['users'],
    targetSelectors: [
      {
        include: {
          tables: ['media.images'],
        },
      },
      {
        exclude: {
          tables: ['sessions'],
          columns: ['created_at', 'updated_at'],
        },
      },
      {
        include: {
          tables: ['sessions'],
          columns: ['media.images.updated_at'],
        },
      },
    ],
    output: {
      root: '/generated',
    },
  });
  t.snapshot(res);
});
