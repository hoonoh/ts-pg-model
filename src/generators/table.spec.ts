import test from 'ava';
import { pascalCase } from 'change-case';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { Column, validateUserConfig } from '../config';
import { enumTypesBareQuery, tableAndColumnsQuery } from '../config/querries';
import { PgEnumTypeBare } from '../config/types/pg';
import { connectionURI } from '../test/constants';
import { MockFs } from '../test/helpers/mock-fs';
import { mockPool } from '../test/helpers/mock-pool';
import { TitleHelper } from '../test/helpers/title';
import { generateEnumFiles } from './enum-type';
import { generateTableFile } from './table';

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

test(titleHelper.should('render tables'), async t => {
  MockFs.mockDirectory(generateRoot);

  const enumFooBar: PgEnumTypeBare[] = [
    {
      schema: 'foo_bar',
      name: 'bar_baz',
      label: 'bar_baz_label1',
      sortOrder: 1,
    },
    {
      schema: 'foo_bar',
      name: 'bar_baz',
      label: 'bar_baz_label2',
      sortOrder: 2,
    },
    {
      schema: 'foo_bar',
      name: 'bar_baz',
      label: 'bar_baz_label3',
      sortOrder: 3,
    },
  ];

  const enumBar: PgEnumTypeBare[] = [
    {
      schema: 'bar',
      name: 'baz_qux',
      label: 'baz_qux_label1',
      sortOrder: 1,
    },
    {
      schema: 'bar',
      name: 'baz_qux',
      label: 'baz_qux_label2',
      sortOrder: 2,
    },
    {
      schema: 'bar',
      name: 'baz_qux',
      label: 'baz_qux_label3',
      sortOrder: 3,
    },
  ];

  const tableAndColumns: Column[] = [
    {
      schema: 'foo_bar',
      tableName: 'foo_bar_baz',
      columnName: 'baz_qux',
      dataType: 'text',
      isNullable: true,
      udtName: 'text',
    },
    {
      schema: 'foo_bar',
      tableName: 'foo_bar_baz',
      columnName: 'enum_bar_baz',
      dataType: 'bar_baz',
      isNullable: false,
      udtName: 'bar_baz',
      userDefinedUdtSchema: 'foo_bar',
      default: 'bar_baz_label1',
    },
    {
      schema: 'bar',
      tableName: 'baz',
      columnName: 'qux',
      dataType: 'text',
      isNullable: false,
      udtName: 'text',
    },
    {
      schema: 'bar',
      tableName: 'baz',
      columnName: 'enum_baz_qux',
      dataType: 'baz_qux',
      isNullable: false,
      udtName: 'baz_qux',
      userDefinedUdtSchema: 'bar',
    },
  ];

  const pool = mockPool(
    [
      {
        sql: enumTypesBareQuery.sql,
        rows: [...enumFooBar, ...enumBar],
      },
      {
        sql: tableAndColumnsQuery.sql,
        rows: tableAndColumns,
      },
    ],
    tableAndColumns,
  );

  const config = await validateUserConfig({
    connectionURI,
    output: { root: generateRoot, includeSchemaPath: true },
    pool,
    conventions: {
      columns: 'camelCase',
    },
  });

  const schemas = tableAndColumns.reduce((acc, cur) => {
    if (!acc.includes(cur.schema)) acc.push(cur.schema);
    return acc;
  }, [] as string[]);

  await generateEnumFiles(config);

  const enumCase = config.conventions.types;

  schemas.forEach(schemaRaw => {
    const schemaRoot = resolve(generateRoot, config.conventions.paths(schemaRaw));
    const enumFiles = readdirSync(schemaRoot);
    enumFiles.forEach(p => {
      const enumFile = readFileSync(resolve(schemaRoot, p), { encoding: 'utf-8' });
      if (schemaRaw === 'foo_bar') {
        enumFooBar.forEach(e => t.true(enumFile.includes(`${enumCase(e.label)} = "${e.label}"`)));
        t.true(enumFile.includes(`export enum ${pascalCase(enumFooBar[0].name)}`));
      } else if (schemaRaw === 'bar') {
        enumBar.forEach(e => t.true(enumFile.includes(`${enumCase(e.label)} = "${e.label}"`)));
        t.true(enumFile.includes(`export enum ${pascalCase(enumBar[0].name)}`));
      } else {
        throw new Error('unexpected schema while checking enum output');
      }
    });
  });

  await generateTableFile(config);

  schemas.forEach(schemaRaw => {
    const schemaRoot = resolve(generateRoot, config.conventions.paths(schemaRaw));
    const tableFiles = readdirSync(schemaRoot).filter(
      f => !f.includes(`${config.conventions.paths('enum-types')}.ts`),
    );
    tableFiles.forEach(p => {
      const tableFile = readFileSync(resolve(schemaRoot, p), { encoding: 'utf-8' });
      if (schemaRaw === 'foo_bar') {
        t.snapshot(tableFile, 'foo_bar.foo_bar_baz table output');
      } else if (schemaRaw === 'bar') {
        t.snapshot(tableFile, 'bar.baz table output');
      } else {
        throw new Error('unexpected schema while checking table output');
      }
    });
  });
});
