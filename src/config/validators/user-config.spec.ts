import test from 'ava';
import { resolve } from 'path';
import { cwd } from 'process';

import { validateUserConfig } from '../../config/validators/user-config.js';
import { connectionURI } from '../../test/constants.js';
import { MockFs } from '../../test/helpers/mock-fs.js';
import { TitleHelper } from '../../test/helpers/title.js';
import { serialAfterEach } from '../../test/init.js';

serialAfterEach(test);

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
  t.not(error, undefined);
  if (error) t.is(error.message, `invalid schema name: "${invalidSchema}"`);
});

titleHelper.ungroup();
//
// typeMap
//
titleHelper.group('typeMap');

test(titleHelper.should('handle user defined typeMap'), async t => {
  const res = await validateUserConfig({
    connectionURI,
    schemas: ['media'],
    typeMap: {
      udt: {
        uuid: 'Buffer',
      },
    },
  });
  t.is(res.renderTargets.media.images.columns.id.type.ts, 'Buffer');
});

test(titleHelper.should('handle user defined enum type'), async t => {
  const res = await validateUserConfig({
    connectionURI,
    schemas: ['media'],
  });
  t.deepEqual(res.renderTargets.media.images.columns.type.type.enum, {
    labels: ['jpg', 'gif', 'webp'],
    name: 'image_type',
    schema: 'media',
  });
});

test(titleHelper.should('handle user defined composite type'), async t => {
  const res = await validateUserConfig({
    connectionURI,
    schemas: ['media'],
  });
  t.deepEqual(res.renderTargets.media.images.columns.domain.type.composite, {
    schema: 'public',
    name: 'domain',
    attributes: { host: 'string', version: 'number' },
  });
});

titleHelper.ungroup();
//
// snapshot
//
titleHelper.group('snapshot');

test.serial(titleHelper.should('validate `UserConfig` and return expected `Config`'), async t => {
  MockFs.mockString({
    [new URL(resolve(cwd(), 'package.json'), import.meta.url).pathname]: `{"type":"module"}`,
    '/tsconfig.json': `{}`,
  });
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
    typeMap: {
      json: [
        {
          schema: 'media',
          tableName: 'images',
          columnName: 'metadata',
          name: 'ImageMetadata',
        },
      ],
    },
    output: {
      root: '/generated',
    },
    tsConfig: '/tsconfig.json',
  });
  t.snapshot(res);
});

test.serial(titleHelper.should('have empty importSuffix if not ESM project'), async t => {
  MockFs.mockString({
    [new URL(resolve(cwd(), 'package.json'), import.meta.url).pathname]: `{}`,
    '/tsconfig.json': `{}`,
  });
  const res = await validateUserConfig({
    connectionURI,
    tsConfig: '/tsconfig.json',
  });
  t.true(res.importSuffix === '');
});
