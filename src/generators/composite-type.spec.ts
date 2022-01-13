import test from 'ava';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  compositeTypesBareQuery,
  enumTypesBareQuery,
  tableAndColumnsQuery,
} from '../config/querries.js';
import { validateUserConfig } from '../config/validators/user-config.js';
import { connectionURI } from '../test/constants.js';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator.js';
import { MockFs } from '../test/helpers/mock-fs.js';
import { mockPool } from '../test/helpers/mock-pool.js';
import { TitleHelper } from '../test/helpers/title.js';
import { serialAfterEach } from '../test/init.js';
import { generateCompositeFiles } from './composite-type.js';

serialAfterEach(test);

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

test.serial(titleHelper.should('generate composite types'), async t => {
  MockFs.mockDirectory(generateRoot);

  const { tableAndColumns, enums, compositeTypes } = renderTargetsToQueryRes({
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
          enumColumns: [
            {
              columnName: 'enum_foo',
              enumName: 'foo',
              enumLabels: ['foo', 'bar', 'baz'],
            },
          ],
          compositeTypeColumns: [
            {
              columnName: 'composite_bar',
              compositeTypeName: 'bar',
              attributes: [
                {
                  type: 'ts',
                  name: 'text_attr',
                  value: 'string',
                },
                {
                  type: 'enum',
                  name: 'enum_attr',
                  value: {
                    name: 'foo',
                    labels: ['foo', 'bar', 'baz'],
                  },
                },
              ],
            },
            {
              columnName: 'composite_baz',
              compositeTypeName: 'baz',
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
        sql: enumTypesBareQuery.sql,
        rows: enums,
      },
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
    conventions: { columns: 'camelCase', types: 'camelCase' },
  });

  await generateCompositeFiles(config);

  const compositeFilePath = resolve(
    generateRoot,
    'foo',
    `${config.conventions.paths('composite-types')}.ts`,
  );
  const compositeFile = readFileSync(compositeFilePath, { encoding: 'utf-8' });

  t.true(compositeFile.includes(`import { Foo } from "./enum-types";`));
  t.true(compositeFile.includes(`export type Bar`));
  t.true(compositeFile.includes(`textAttr: string;`));
  t.true(compositeFile.includes(`enumAttr: Foo;`));
  t.true(compositeFile.includes(`export type Baz`));
  t.true(compositeFile.includes(`textAttr: string;`));
});
