import test from 'ava';

import { TitleHelper } from '../../test/helpers/title';
import { validateColumnNames } from './column';

const tableAndColumns = [
  {
    schema: 'users',
    tableName: 'users',
    columnName: 'id',
    dataType: 'integer',
    userDefinedUdtSchema: null,
    udtName: 'int4',
    isNullable: false,
    tableComment: null,
    default: "nextval('users.users_id_seq'::regclass)",
  },
  // equal data as above, added for branch coverage
  {
    schema: 'users',
    tableName: 'users',
    columnName: 'id',
    dataType: 'integer',
    userDefinedUdtSchema: null,
    udtName: 'int4',
    isNullable: false,
    tableComment: null,
    default: "nextval('users.users_id_seq'::regclass)",
  },
];

const titleHelper = new TitleHelper();

test(titleHelper.should('handle column name with schema & table name'), async t => {
  const columnFullName = 'users.users.id';
  const [schema, tableName, columnName] = columnFullName.split('.');
  const res = validateColumnNames({ tableAndColumns, names: [columnFullName] });
  t.deepEqual(res, [{ schema, tableName, columnName }]);
});

test(titleHelper.should('handle column name with table name'), async t => {
  const columnFullName = 'users.id';
  const [tableName, columnName] = columnFullName.split('.');
  const res = validateColumnNames({ tableAndColumns, names: [columnFullName] });
  t.deepEqual(res, [{ schema: 'users', tableName, columnName }]);
});

test(titleHelper.should('handle column name only'), async t => {
  const columnName = 'id';
  const res = validateColumnNames({ tableAndColumns, names: [columnName] });
  t.deepEqual(res, [{ schema: 'users', tableName: 'users', columnName }]);
});

test(titleHelper.should('return undefined if no names are supplied'), async t => {
  const res = validateColumnNames({ tableAndColumns });
  t.deepEqual(res, undefined);
});

test(titleHelper.throwsWhen('invalid column name format is given'), async t => {
  const invalidColumnName = 'foo.bar.baz.bazzz';
  const error = t.throws(() =>
    validateColumnNames({ tableAndColumns, names: [invalidColumnName] }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('column name with invalid schema is given'), async t => {
  const invalidColumnName = 'foo.bar.baz';
  const error = t.throws(() =>
    validateColumnNames({ tableAndColumns, names: [invalidColumnName] }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('column name with invalid table is given'), async t => {
  const invalidColumnName = 'foo.bar';
  const error = t.throws(() =>
    validateColumnNames({ tableAndColumns, names: [invalidColumnName] }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});

test(titleHelper.throwsWhen('invalid column name given'), async t => {
  const invalidColumnName = 'foo';
  const error = t.throws(() =>
    validateColumnNames({ tableAndColumns, names: [invalidColumnName] }),
  );
  t.is(error.message, `invalid column name: "${invalidColumnName}"`);
});
