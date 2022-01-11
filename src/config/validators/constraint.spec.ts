import test from 'ava';

import { TitleHelper } from './../../test/helpers/title.js';
import { PgConstraintsBare } from './../types/pg.js';
import { validateConstratints } from './constraint.js';

const titleHelper = new TitleHelper();

test(titleHelper.should('resolve primary key'), t => {
  const constraintBare: PgConstraintsBare = {
    schema: 'foo',
    tableName: 'bar',
    constraintName: 'baz',
    type: 'p',
    definition: 'PRIMARY KEY (foo, bar, baz)',
  };
  const res = validateConstratints([constraintBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      type: 'PrimaryKey',
      definition: 'PRIMARY KEY (foo, bar, baz)',
      columnNames: ['foo', 'bar', 'baz'],
      docs: '@primaryKey baz (foo, bar, baz)',
    },
  ]);
});

test(titleHelper.should('resolve multi column foreign key'), t => {
  const constraintBare: PgConstraintsBare = {
    schema: 'foo',
    tableName: 'bar',
    constraintName: 'baz',
    type: 'f',
    definition: 'FOREIGN KEY (foo, bar, baz) REFERENCES bar(foo, bar, baz)',
  };
  const res = validateConstratints([constraintBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      type: 'ForeignKey',
      definition: 'FOREIGN KEY (foo, bar, baz) REFERENCES bar(foo, bar, baz)',
      columnNames: ['foo', 'bar', 'baz'],
      docs: '@foreignKey baz ((foo, bar, baz)->bar(foo, bar, baz))',
    },
  ]);
});

test(titleHelper.should('resolve single column foreign key'), t => {
  const constraintBare: PgConstraintsBare = {
    schema: 'foo',
    tableName: 'bar',
    constraintName: 'baz',
    type: 'f',
    definition: 'FOREIGN KEY (foo) REFERENCES bar(foo)',
  };
  const res = validateConstratints([constraintBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      type: 'ForeignKey',
      definition: 'FOREIGN KEY (foo) REFERENCES bar(foo)',
      columnNames: ['foo'],
      docs: '@foreignKey baz (bar(foo))',
    },
  ]);
});

test(titleHelper.should('resolve unique constraint'), t => {
  const constraintBare: PgConstraintsBare = {
    schema: 'foo',
    tableName: 'bar',
    constraintName: 'baz',
    type: 'u',
    definition: 'UNIQUE (foo)',
  };
  const res = validateConstratints([constraintBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      type: 'Unique',
      definition: 'UNIQUE (foo)',
      columnNames: ['foo'],
      docs: '@unique baz (foo)',
    },
  ]);
});

test(titleHelper.should('resolve check constraint'), t => {
  const constraintBare: PgConstraintsBare = {
    schema: 'foo',
    tableName: 'bar',
    constraintName: 'baz',
    type: 'c',
    definition:
      'CHECK ((((foo IS NOT NULL) AND ((bar IS NOT NULL) OR (baz IS NOT NULL))) OR (NOT (qux IS NULL))))',
  };
  const res = validateConstratints([constraintBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      type: 'Check',
      definition:
        'CHECK ((((foo IS NOT NULL) AND ((bar IS NOT NULL) OR (baz IS NOT NULL))) OR (NOT (qux IS NULL))))',
      columnNames: ['foo', 'bar', 'baz', 'qux'],
      docs: '@check baz (((((foo IS NOT NULL) AND ((bar IS NOT NULL) OR (baz IS NOT NULL))) OR (NOT (qux IS NULL)))))',
    },
  ]);
});

test(titleHelper.should('resolve exclude constraint'), t => {
  const constraintBare: PgConstraintsBare = {
    schema: 'foo',
    tableName: 'bar',
    constraintName: 'baz',
    type: 'x',
    definition: 'EXCLUDE USING gist (foo WITH =, bar WITH <>)',
  };
  const res = validateConstratints([constraintBare]);

  t.deepEqual(res, [
    {
      schema: 'foo',
      tableName: 'bar',
      name: 'baz',
      type: 'Exclude',
      definition: 'EXCLUDE USING gist (foo WITH =, bar WITH <>)',
      columnNames: ['foo', 'bar'],
      docs: '@exclude baz (gist (foo WITH =, bar WITH <>))',
    },
  ]);
});
