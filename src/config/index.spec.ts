import test from 'ava';

import { MockFs } from '../test/mock-fs-helper';
import { TitleHelper } from '../test/title-helper';
import { assertConfig } from '.';

Error.stackTraceLimit = Number.POSITIVE_INFINITY;

test.serial.afterEach(() => {
  MockFs.restore();
  delete process.env.PG_CONNECTION_URI;
});

const titleHelper = new TitleHelper();

const connectionURI = 'postgresql://postgres:secretpassword@localhost:54321/postgres';
const dotEnvPath = '/foo/bar/.env';

//
// assertConfig()
//
titleHelper.group('assertConfig()');

//
// connectionURI
//
titleHelper.group('connectionURI');

test.serial(titleHelper.should('parse dotEnv file'), async t => {
  MockFs.mockString({
    [dotEnvPath]: `PG_CONNECTION_URI=${connectionURI}`,
  });
  const p = assertConfig({
    dotEnvPath,
  });
  t.notThrowsAsync(p);
  t.is((await p).connectionURI, connectionURI);
});

test.serial(titleHelper.throwsWhen('dotEnv PG_CONNECTION_URI is invalid'), async t => {
  MockFs.mockString({
    [dotEnvPath]: `PG_CONNECTION_URI=invalid`,
  });
  await t.throwsAsync(assertConfig({ dotEnvPath }));
});

test(titleHelper.throwsWhen('dotEnv file not found'), async t => {
  await t.throwsAsync(assertConfig({ dotEnvPath }));
});

test(titleHelper.throwsWhen('uri is invalid'), async t => {
  await t.throwsAsync(assertConfig({ connectionURI: `${connectionURI}FooBar` }));
});

test(titleHelper.throwsWhen('connectionURI is invalid'), async t => {
  await t.throwsAsync(assertConfig({ connectionURI: `invalid` as `postgres://${string}` }));
});

titleHelper.ungroup();

//
// schema
//
titleHelper.group('schema');

test(titleHelper.should('load default schemas'), async t => {
  const res = await assertConfig({
    connectionURI,
  });
  t.deepEqual(res.schemas, ['public']);
  t.deepEqual(Object.keys(res.renderTargets), ['public']);
});

test(titleHelper.should('handle schema'), async t => {
  const schema = 'users';
  const res = await assertConfig({
    connectionURI,
    schemas: [schema],
  });
  t.deepEqual(res.schemas, [schema]);
  t.deepEqual(Object.keys(res.renderTargets), [schema]);
});

test(titleHelper.throwsWhen('invalid schema is given'), async t => {
  const invalidSchema = 'fooBar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [`${invalidSchema}`],
    }),
  );
  t.is(error.message, `invalid schema name: "${invalidSchema}"`);
});

titleHelper.ungroup();

//
// table
//
titleHelper.group('table');

test(titleHelper.should('handle table name with schema'), async t => {
  const tableName = 'users.users';
  const [schema, name] = tableName.split('.');
  const res = await assertConfig({
    connectionURI,
    schemas: [],
    targetSelectors: [
      {
        include: { tables: [tableName] },
      },
    ],
  });
  t.deepEqual(res.schemas, []);
  t.deepEqual(Object.keys(res.renderTargets), [schema]);
  t.deepEqual(Object.keys(res.renderTargets[schema]), [name]);
});

test(titleHelper.should('handle table name without schema'), async t => {
  const name = 'users';
  const res = await assertConfig({
    connectionURI,
    schemas: [],
    targetSelectors: [{ include: { tables: [name] } }],
  });
  t.deepEqual(res.schemas, []);
  t.deepEqual(Object.keys(res.renderTargets), ['users']);
  t.deepEqual(Object.keys(res.renderTargets.users), [name]);
});

test(titleHelper.throwsWhen('invalid table name format is given'), async t => {
  const invalidTableName = 'foo.bar.baz';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { tables: [invalidTableName] } }],
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid schema in table name is given'), async t => {
  const invalidTableName = 'foo.bar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { tables: [invalidTableName] } }],
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid table name without schema is given'), async t => {
  const invalidTableName = 'bar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { tables: [invalidTableName] } }],
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid table name with valid schema is given'), async t => {
  const invalidTableName = 'users.foo';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { tables: [invalidTableName] } }],
    }),
  );
  t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

titleHelper.ungroup();

//
// column
//
titleHelper.group('column');

test(titleHelper.should('handle column name with schema & table name'), async t => {
  const columnName = 'users.users.id';
  await t.notThrowsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { columns: [columnName] } }],
    }),
  );
});

test(titleHelper.should('handle column name with table name'), async t => {
  const columnName = 'users.id';
  await t.notThrowsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { columns: [columnName] } }],
    }),
  );
});

test(titleHelper.should('handle column name only'), async t => {
  const columnName = 'id';
  await t.notThrowsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { columns: [columnName] } }],
    }),
  );
});

test(titleHelper.throwsWhen('invalid column name format is given'), async t => {
  const invalidColumnName = 'foo.bar.baz.bazzz';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { columns: [invalidColumnName] } }],
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('column name with invalid schema is given'), async t => {
  const invalidColumnName = 'foo.bar.baz';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { columns: [invalidColumnName] } }],
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('column name with invalid table is given'), async t => {
  const invalidColumnName = 'foo.bar';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { columns: [invalidColumnName] } }],
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('invalid column name given'), async t => {
  const invalidColumnName = 'foo';
  const error = await t.throwsAsync(
    assertConfig({
      connectionURI,
      schemas: [],
      targetSelectors: [{ include: { columns: [invalidColumnName] } }],
    }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

titleHelper.ungroup();

titleHelper.ungroup();
