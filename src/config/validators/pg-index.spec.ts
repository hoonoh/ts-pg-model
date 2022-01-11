import test from 'ava';

import { TitleHelper } from './../../test/helpers/title.js';
import { PgIndexBare } from './../types/pg.js';
import { validateIndexes } from './pg-index.js';

const titleHelper = new TitleHelper();

test(titleHelper.should('resolve single column index'), t => {
  const indexBare: PgIndexBare = {
    schema: 'foo',
    tableName: 'bar',
    indexName: 'baz',
    definition: 'CREATE INDEX baz ON foo.bar USING btree (qux)',
  };
  const res = validateIndexes([indexBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      definition: 'CREATE INDEX baz ON foo.bar USING btree (qux)',
      isUnique: false,
      using: 'btree',
      columnNames: ['qux'],
      docs: '@index `btree` baz (qux)',
    },
  ]);
});

test(titleHelper.should('resolve multi column index'), t => {
  const indexBare: PgIndexBare = {
    schema: 'foo',
    tableName: 'bar',
    indexName: 'baz',
    definition: 'CREATE INDEX baz ON foo.bar USING btree (qux, quux)',
  };
  const res = validateIndexes([indexBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      definition: 'CREATE INDEX baz ON foo.bar USING btree (qux, quux)',
      isUnique: false,
      using: 'btree',
      columnNames: ['qux', 'quux'],
      docs: '@index `btree` baz (qux, quux)',
    },
  ]);
});

test(titleHelper.should('resolve single column unique index'), t => {
  const indexBare: PgIndexBare = {
    schema: 'foo',
    tableName: 'bar',
    indexName: 'baz',
    definition: 'CREATE UNIQUE INDEX baz ON foo.bar USING btree (qux)',
  };
  const res = validateIndexes([indexBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      definition: 'CREATE UNIQUE INDEX baz ON foo.bar USING btree (qux)',
      isUnique: true,
      using: 'btree',
      columnNames: ['qux'],
      docs: '@index `btree` baz (qux)',
    },
  ]);
});

test(titleHelper.should('resolve multi column unique index'), t => {
  const indexBare: PgIndexBare = {
    schema: 'foo',
    tableName: 'bar',
    indexName: 'baz',
    definition: 'CREATE UNIQUE INDEX baz ON foo.bar USING btree (qux, quux)',
  };
  const res = validateIndexes([indexBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      definition: 'CREATE UNIQUE INDEX baz ON foo.bar USING btree (qux, quux)',
      isUnique: true,
      using: 'btree',
      columnNames: ['qux', 'quux'],
      docs: '@index `btree` baz (qux, quux)',
    },
  ]);
});
