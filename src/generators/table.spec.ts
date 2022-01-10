import test from 'ava';
import { pascalCase } from 'change-case';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { validateUserConfig } from '../config';
import { enumTypesBareQuery, tableAndColumnsQuery } from '../config/querries';
import { connectionURI } from '../test/constants';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator';
import { MockFs } from '../test/helpers/mock-fs';
import { mockPool } from '../test/helpers/mock-pool';
import { TitleHelper } from '../test/helpers/title';
import { generateEnumFiles } from './enum-type';
import { generateTableFile } from './table';

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

test(titleHelper.should('render tables'), async t => {
  MockFs.mockDirectory(generateRoot);

  const { columns: columnsFooBar, enums: enumFooBar } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'foo_bar',
      tableSpecs: [
        {
          tableName: 'foo_bar_baz',
          pgColumns: [
            {
              columnName: 'baz_qux',
              type: 'text',
              isNullable: true,
            },
          ],
          enumColumns: [
            {
              columnName: 'enum_bar_baz',
              enumName: 'bar_baz',
              enumLabels: ['bar_baz_label_1', 'bar_baz_label_2', 'bar_baz_label_2'],
              defaults: 'bar_baz_label1',
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
          tableName: 'baz',
          pgColumns: [
            {
              columnName: 'qux',
              type: 'text',
            },
          ],
          enumColumns: [
            {
              columnName: 'enum_baz_qux',
              enumName: 'baz_qux',
              enumLabels: ['baz_qux_label_1', 'baz_qux_label_2', 'baz_qux_label_2'],
            },
          ],
        },
      ],
    }),
  });

  const tableAndColumns = [...columnsFooBar, ...columnsBar];

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
