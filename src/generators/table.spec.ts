import test from 'ava';
import { pascalCase } from 'change-case';
import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve } from 'path';

import {
  compositeTypesBareQuery,
  constraintsBareQuery,
  enumTypesBareQuery,
  indexesBareQuery,
  tableAndColumnsQuery,
} from '../config/querries.js';
import { validateUserConfig } from '../config/validators/user-config.js';
import { connectionURI } from '../test/constants.js';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator.js';
import { MockFs } from '../test/helpers/mock-fs.js';
import { mockPool } from '../test/helpers/mock-pool.js';
import { TitleHelper } from '../test/helpers/title.js';
import { serialAfterEach } from '../test/init.js';
import { generateEnumFiles } from './enum-type.js';
import { generateTableFile } from './table.js';

serialAfterEach(test);

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

test(titleHelper.should('render tables'), async t => {
  MockFs.mockDirectory(generateRoot);

  const {
    tableAndColumns: tableAndColumnsFooBar,
    enums: enumFooBar,
    compositeTypes: compositeTypesFooBar,
    indexes: indexesFooBar,
    constraints: constraintsFooBar,
  } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'foo_bar',
      tableSpecs: [
        {
          tableName: 'foo_bar_baz',
          pgColumns: [
            {
              columnName: 'baz_qux',
              pgType: 'text',
              isNullable: true,
              comment: 'baz_qux comment',
            },
            {
              columnName: 'fkey_col',
              pgType: 'text',
            },
            {
              columnName: 'json_col',
              pgType: 'jsonb',
            },
            {
              columnName: 'tz_col',
              pgType: 'timestamp with time zone',
            },
          ],
          enumColumns: [
            {
              columnName: 'enum_bar_baz',
              enumName: 'bar_baz',
              enumLabels: ['bar_baz_label_1', 'bar_baz_label_2', 'bar_baz_label_2'],
              defaults: 'bar_baz_label1',
              comment: 'enum_bar_baz comment',
            },
          ],
          compositeTypeColumns: [
            {
              columnName: 'composite_baz_qux',
              compositeTypeName: 'baz_qux',
              attributes: [
                {
                  // from above enum
                  type: 'enum',
                  name: 'bar_baz_attr',
                  value: {
                    name: 'bar_baz',
                    labels: ['bar_baz_label_1', 'bar_baz_label_2', 'bar_baz_label_2'],
                  },
                },
                {
                  type: 'ts',
                  name: 'text_attr',
                  value: 'string',
                },
              ],
            },
          ],
          indexSpecs: [
            {
              indexName: 'baz_qux_idx',
              definition: 'CREATE INDEX baz_qux_idx ON foo_bar.foo_bar_baz USING btree (baz_qux)',
            },
          ],
          constraintSpecs: [
            {
              type: 'p',
              definition: 'PRIMARY KEY (baz_qux)',
              constraintName: 'baz_qux_pkey',
            },
            {
              type: 'f',
              definition: 'FOREIGN KEY (fkey_col) REFERENCES bar.baz (qux)',
              constraintName: 'fkey_col_fkey',
            },
            {
              type: 'u',
              definition: 'UNIQUE (baz_qux)',
              constraintName: 'baz_qux_unique',
            },
            {
              type: 'c',
              definition: 'CHECK (baz_qux IS NOT NULL)',
              constraintName: 'baz_qux_check',
            },
            {
              type: 'x',
              definition: 'EXCLUDE USING gist (baz_qux WITH =)',
              constraintName: 'baz_qux_exclude',
            },
          ],
        },
      ],
    }),
  });

  const {
    tableAndColumns: tableAndColumnsBar,
    enums: enumBar,
    compositeTypes: compositeTypesBar,
    indexes: indexesBar,
    constraints: constraintsBar,
  } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'bar',
      tableSpecs: [
        {
          tableName: 'baz',
          pgColumns: [
            {
              columnName: 'qux',
              pgType: 'text',
            },
          ],
          enumColumns: [
            {
              columnName: 'enum_baz_qux',
              enumName: 'baz_qux',
              enumLabels: ['baz_qux_label_1', 'baz_qux_label_2', 'baz_qux_label_2'],
            },
          ],
          indexSpecs: [
            {
              indexName: 'baz__baz_qux_idx',
              definition:
                'CREATE INDEX baz__baz_qux_idx ON bar.baz USING btree (qux, enum_baz_qux)',
            },
          ],
        },
      ],
    }),
  });

  const tableAndColumns = [...tableAndColumnsFooBar, ...tableAndColumnsBar];

  const pool = mockPool(
    [
      {
        sql: enumTypesBareQuery.sql,
        rows: [...enumFooBar, ...enumBar],
      },
      {
        sql: compositeTypesBareQuery.sql,
        rows: [...compositeTypesFooBar, ...compositeTypesBar],
      },
      {
        sql: tableAndColumnsQuery.sql,
        rows: tableAndColumns,
      },
      {
        sql: indexesBareQuery.sql,
        rows: [...indexesFooBar, ...indexesBar],
      },
      {
        sql: constraintsBareQuery.sql,
        rows: [...constraintsFooBar, ...constraintsBar],
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

test.serial(titleHelper.should('ignore composite columns'), async t => {
  MockFs.mockDirectory(generateRoot);

  const { tableAndColumns, compositeTypes } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'foo',
      tableSpecs: [
        {
          tableName: 'bar',
          pgColumns: [
            {
              columnName: 'baz',
              pgType: 'text',
            },
          ],
          compositeTypeColumns: [
            {
              columnName: 'composite_qux',
              compositeTypeName: 'qux',
              attributes: [
                {
                  type: 'ts',
                  name: 'text_attr',
                  value: 'string',
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  const pool = mockPool(
    [
      {
        sql: compositeTypesBareQuery.sql,
        rows: compositeTypes,
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
    conventions: { columns: 'camelCase' },
    ignoreCompositeTypeColumns: true,
  });

  await generateTableFile(config);

  const schemaRoot = resolve(generateRoot, config.conventions.paths('foo'));
  const tableFilePath = resolve(schemaRoot, `${config.conventions.paths('bar')}.ts`);
  t.notThrows(() => statSync(tableFilePath));

  const tableFile = readFileSync(tableFilePath, { encoding: 'utf-8' });
  t.true(tableFile.includes('@table foo.bar'));
  t.true(tableFile.includes('export interface Bar'));
  t.true(tableFile.includes('@column foo.bar.baz'));
  t.false(tableFile.includes('@pgtype [composite]'));
});
