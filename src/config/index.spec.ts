import test from 'ava';
import mockFs from 'mock-fs';
import { resolve } from 'path';

import { TitleHelper } from '../test/title-helper';
import { assertConfig } from '.';

Error.stackTraceLimit = Number.POSITIVE_INFINITY;

test.serial.afterEach(() => {
  mockFs.restore();
  delete process.env.PG_CONNECTION_URI;
});

const titleHelper = new TitleHelper();

const connectionURI = 'postgresql://postgres:secretpassword@localhost:54321/postgres';
const dotEnvPath = '/foo/bar/.env';

//
// assertConfig()
//
titleHelper.group('assertConfig()');

test.serial(titleHelper.should('should parse dotEnv file'), async t => {
  mockFs({
    node_modules: mockFs.load(resolve(__dirname, '../../node_modules'), { recursive: true }),
    [dotEnvPath]: `PG_CONNECTION_URI=${connectionURI}`,
  });
  const p = assertConfig({
    dotEnvPath,
  });
  t.notThrowsAsync(p);
  t.is((await p).connectionURI, connectionURI);
  // mockFs.restore();
});

test(titleHelper.throwsWhen('dotEnv file not found'), async t => {
  await t.throwsAsync(assertConfig({ dotEnvPath }));
});

test(titleHelper.should('validate empty config'), async t => {
  t.deepEqual(await assertConfig(), {});
});

test(titleHelper.throwsWhen('uri is invalid'), async t => {
  await t.throwsAsync(assertConfig({ connectionURI: `${connectionURI}FooBar` }));
});

//
// schema
//
test(titleHelper.throwsWhen('invalid schema is given'), async t => {
  const invalidSchema = 'fooBar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        schema: [`${invalidSchema}`],
      },
    }),
  );
  t.is(error.message, `invalid schema name: "${invalidSchema}"`);
});

//
// table
//
test(titleHelper.throwsWhen('invalid table name format is given'), async t => {
  const invalidTableName = 'foo.bar.baz';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        table: [invalidTableName],
      },
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid schema in table name is given'), async t => {
  const invalidTableName = 'foo.bar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        table: [invalidTableName],
      },
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid table name without schema is given'), async t => {
  const invalidTableName = 'bar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        table: [invalidTableName],
      },
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid table name with valid schema is given'), async t => {
  const invalidTableName = 'users.foo';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        table: [invalidTableName],
      },
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

//
// column
//
test(titleHelper.throwsWhen('invalid column name format is given'), async t => {
  const invalidColumnName = 'foo.bar.baz.bazzz';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        column: [invalidColumnName],
      },
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('column name with invalid schema is given'), async t => {
  const invalidColumnName = 'foo.bar.baz';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        column: [invalidColumnName],
      },
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('column name with invalid table is given'), async t => {
  const invalidColumnName = 'foo.bar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        column: [invalidColumnName],
      },
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('invalid column name given'), async t => {
  const invalidColumnName = 'foo';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      include: {
        column: [invalidColumnName],
      },
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});
