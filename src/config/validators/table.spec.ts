import test from 'ava';

import { TitleHelper } from '../../test/helpers/title';
import { validateTableNames } from './table';

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
];

const titleHelper = new TitleHelper();

test(titleHelper.should('handle table name with schema'), async t => {
  const tableNameWithSchema = 'users.users';
  const [schema, tableName] = tableNameWithSchema.split('.');
  const res = validateTableNames({ tableAndColumns, names: [tableNameWithSchema] });
  t.deepEqual(res, [{ schema, tableName }]);
});

test(titleHelper.should('handle table name without schema'), async t => {
  const tableName = 'users';
  const res = validateTableNames({ tableAndColumns, names: [tableName] });
  t.deepEqual(res, [{ schema: 'users', tableName }]);
});

test(titleHelper.should('return undefined if no names are supplied'), async t => {
  const res = validateTableNames({ tableAndColumns });
  t.deepEqual(res, undefined);
});

test(titleHelper.throwsWhen('invalid table name format is given'), async t => {
  const invalidTableName = 'foo.bar.baz';
  const error = t.throws(() => validateTableNames({ tableAndColumns, names: [invalidTableName] }));
  t.not(error, undefined);
  if (error) t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid schema in table name is given'), async t => {
  const invalidTableName = 'foo.bar';
  const error = t.throws(() => validateTableNames({ tableAndColumns, names: [invalidTableName] }));
  t.not(error, undefined);
  if (error) t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid table name without schema is given'), async t => {
  const invalidTableName = 'bar';
  const error = t.throws(() => validateTableNames({ tableAndColumns, names: [invalidTableName] }));
  t.not(error, undefined);
  if (error) t.is(error.message, `invalid table name: "${invalidTableName}"`);
});

test(titleHelper.throwsWhen('invalid table name with valid schema is given'), async t => {
  const invalidTableName = 'users.foo';
  const error = t.throws(() => validateTableNames({ tableAndColumns, names: [invalidTableName] }));
  t.not(error, undefined);
  if (error) t.is(error.message, `invalid table name: "${invalidTableName}"`);
});
