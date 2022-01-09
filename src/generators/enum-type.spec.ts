import test from 'ava';
import { pascalCase } from 'change-case';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { Column, validateUserConfig } from '../config';
import { enumTypesBareQuery, tableAndColumnsQuery } from '../config/querries';
import { PgEnumTypeBare } from '../config/types/pg';
import { connectionURI } from '../test/constants';
import { MockFs } from '../test/helpers/mock-fs';
import { defaultMockPool, mockPool } from '../test/helpers/mock-pool';
import { TitleHelper } from '../test/helpers/title';
import { generateEnumFiles } from './enum-type';

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

test.serial(titleHelper.should('generate enum files as expected'), async t => {
  const enumFoo: PgEnumTypeBare[] = [
    {
      schema: 'foo',
      name: 'bar',
      label: 'foo_bar_label1',
      sortOrder: 1,
    },
    {
      schema: 'foo',
      name: 'bar',
      label: 'foo_bar_label2',
      sortOrder: 2,
    },
    {
      schema: 'foo',
      name: 'bar',
      label: 'foo_bar_label3',
      sortOrder: 3,
    },
  ];

  const enumBar: PgEnumTypeBare[] = [
    {
      schema: 'bar',
      name: 'baz',
      label: 'bar_baz_label1',
      sortOrder: 1,
    },
    {
      schema: 'bar',
      name: 'baz',
      label: 'bar_baz_label2',
      sortOrder: 2,
    },
    {
      schema: 'bar',
      name: 'baz',
      label: 'bar_baz_label3',
      sortOrder: 3,
    },
  ];

  const enums: PgEnumTypeBare[] = [...enumFoo, ...enumBar];

  MockFs.mockDirectory(generateRoot);

  const pool = mockPool([
    {
      sql: enumTypesBareQuery.sql,
      rows: enums,
    },
    {
      sql: tableAndColumnsQuery.sql,
      rows: [
        {
          schema: 'foo',
          tableName: 'bar',
          columnName: 'baz',
          dataType: 'foo.bar',
          isNullable: false,
          udtName: 'foo.bar',
        },
        {
          schema: 'bar',
          tableName: 'baz',
          columnName: 'bazzz',
          dataType: 'foo.bar',
          isNullable: false,
          udtName: 'foo.bar',
        },
      ] as Column[],
    },
  ]);

  const config = await validateUserConfig({
    connectionURI,
    output: { root: generateRoot, includeSchemaPath: true },
    pool,
    conventions: {
      types: 'camelCase',
    },
  });

  await generateEnumFiles(config);

  // check each schema directories created
  readdirSync(generateRoot).forEach(p => t.true(defaultMockPool.schemas.includes(p)));

  defaultMockPool.schemas.forEach(s => {
    // check directory path
    t.is(lstatSync(resolve(generateRoot, s)).isDirectory(), true);
    // check each enum files
    const enumFilePath = resolve(generateRoot, s, 'enum-types.ts');
    t.notThrows(() => readFileSync(enumFilePath).toString());
    const enumCase = config.conventions.types;
    const enumFile = readFileSync(enumFilePath).toString();
    if (s === 'foo') {
      enumFoo.forEach(e => t.true(enumFile.includes(`${enumCase(e.label)} = "${e.label}"`)));
      t.true(enumFile.includes(`export enum ${pascalCase(enumFoo[0].name)}`));
    } else {
      enumBar.forEach(e => t.true(enumFile.includes(`${enumCase(e.label)} = "${e.label}"`)));
      t.true(enumFile.includes(`export enum ${pascalCase(enumBar[0].name)}`));
    }
  });
});
