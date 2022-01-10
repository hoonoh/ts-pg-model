import test from 'ava';
import { pascalCase } from 'change-case';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { validateUserConfig } from '../config';
import { enumTypesBareQuery, tableAndColumnsQuery } from '../config/querries';
import { connectionURI } from '../test/constants';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator';
import { MockFs } from '../test/helpers/mock-fs';
import { defaultMockPool, mockPool } from '../test/helpers/mock-pool';
import { TitleHelper } from '../test/helpers/title';
import { generateEnumFiles } from './enum-type';

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

test.serial(titleHelper.should('generate enum files as expected'), async t => {
  const { columns: columnsFoo, enums: enumFoo } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'foo',
      tableSpecs: [
        {
          tableName: 'foo_table',
          enumColumns: [
            {
              columnName: 'foo_column',
              enumName: 'foo_enum',
              enumLabels: ['foo_label_1', 'foo_label_2', 'foo_label_2'],
            },
          ],
        },
      ],
    }),
  });

  const { columns: columnsBar, enums: enumBar } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'bar',
      tableSpecs: [
        {
          tableName: 'bar_table',
          enumColumns: [
            {
              columnName: 'bar_column',
              enumName: 'bar_enum',
              enumLabels: ['bar_label_1', 'bar_label_2', 'bar_label_2'],
            },
          ],
        },
      ],
    }),
  });

  const enums = [...enumFoo, ...enumBar];

  const tableAndColumns = [...columnsFoo, ...columnsBar];

  MockFs.mockDirectory(generateRoot);

  const pool = mockPool(
    [
      {
        sql: enumTypesBareQuery.sql,
        rows: enums,
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
      types: 'camelCase',
    },
  });

  await generateEnumFiles(config);

  // check each schema directories created
  readdirSync(generateRoot).forEach(p => t.true(defaultMockPool.schemas.includes(p)));

  ['foo', 'bar'].forEach(s => {
    // check directory path
    t.is(lstatSync(resolve(generateRoot, s)).isDirectory(), true);
    // check each enum files
    const enumFilePath = resolve(generateRoot, s, 'enum-types.ts');
    t.notThrows(() => readFileSync(enumFilePath).toString());
    const enumCase = config.conventions.types;
    const enumFile = readFileSync(enumFilePath, { encoding: 'utf-8' });
    if (s === 'foo') {
      enumFoo.forEach(e => t.true(enumFile.includes(`${enumCase(e.label)} = "${e.label}"`)));
      t.true(enumFile.includes(`export enum ${pascalCase(enumFoo[0].name)}`));
    } else if (s === 'bar') {
      enumBar.forEach(e => t.true(enumFile.includes(`${enumCase(e.label)} = "${e.label}"`)));
      t.true(enumFile.includes(`export enum ${pascalCase(enumBar[0].name)}`));
    } else {
      throw new Error('unexpected schema result');
    }
  });
});
