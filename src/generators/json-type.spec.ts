import test from 'ava';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { validateUserConfig } from '../config';
import { tableAndColumnsQuery } from '../config/querries';
import { parseConfigFile } from '../config/validators/parse-config-file';
import { connectionURI } from '../test/constants';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator';
import { MockFs } from '../test/helpers/mock-fs';
import { mockPool } from '../test/helpers/mock-pool';
import { TitleHelper } from '../test/helpers/title';
import { generateJsonTypeFile } from './json-type';

const titleHelper = new TitleHelper();

const configFilePath = '/temp/config.ts';

const commonJsonTypeMap = `
interface JsonTypeMap extends Record<string, JsonType> {
  FooType: {
    foo: string;
    bar: number;
    baz?: {
      foobar: number;
      barbaz: string;
    };
  };
  BarType: {
    bar: number;
    baz: string;
  };
}
`;
const commonConfig = `
export const userConfig: UserConfig<JsonTypeMap> = {
  typeMap: {
    json: [
      {
        schema: 'foo',
        tableName: 'bar',
        columnName: 'baz',
        name: 'FooType',
      },
      {
        schema: 'bar',
        tableName: 'baz',
        columnName: 'qux',
        name: 'BarType',
      },
    ],
  },
};
`;

const commonExpect: [name: string, definition: string][] = [
  ['FooType', '{\nfoo: string;\nbar: number;\nbaz?: {\nfoobar: number;\nbarbaz: string;\n};\n};'],
  ['BarType', '{\nbar: number;\nbaz: string;\n};'],
];

test.serial(titleHelper.should('parse named exports'), async t => {
  MockFs.mockString({
    [configFilePath]: `
      ${commonJsonTypeMap}
      ${commonConfig}`,
  });

  const jsonDefinitions = parseConfigFile(configFilePath);
  t.deepEqual(jsonDefinitions, commonExpect);

  const { tableAndColumns } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'foo',
      tableSpecs: [
        {
          tableName: 'bar',
          pgColumns: [
            {
              columnName: 'baz',
              pgType: 'json',
            },
          ],
        },
      ],
    }),
    ...mockSchema({
      schema: 'bar',
      tableSpecs: [
        {
          tableName: 'baz',
          pgColumns: [
            {
              columnName: 'qux',
              pgType: 'json',
            },
          ],
        },
      ],
    }),
  });

  const pool = mockPool(
    [
      {
        sql: tableAndColumnsQuery.sql,
        rows: tableAndColumns,
      },
    ],
    tableAndColumns,
  );

  const generateRoot = resolve('/test', 'generated');
  MockFs.mockDirectory(generateRoot);

  const config = await validateUserConfig({
    connectionURI,
    output: { root: generateRoot },
    pool,
    conventions: { columns: 'camelCase' },
    typeMap: {
      jsonDefinitions,
      json: [
        {
          schema: 'foo',
          tableName: 'bar',
          columnName: 'baz',
          name: 'FooType',
        },
        {
          schema: 'bar',
          tableName: 'baz',
          columnName: 'qux',
          name: 'BarType',
        },
      ],
    },
  });

  await generateJsonTypeFile(config);

  const jsonTypeFile = readFileSync(
    resolve(generateRoot, `${config.conventions.paths('json-types')}.ts`),
    { encoding: 'utf-8' },
  );

  t.is(
    jsonTypeFile,
    [
      '/**',
      '* @note This file was generated with `ts-pg-model`.',
      '* @generated 2000-01-01T00:00:00.000Z',
      '*/',
      '',
      'export type FooType = {',
      '  foo: string;',
      '  bar: number;',
      '  baz?: {',
      '    foobar: number;',
      '    barbaz: string;',
      '  };',
      '};',
      '',
      'export type BarType = {',
      '  bar: number;',
      '  baz: string;',
      '};',
      '',
    ].join('\n'),
  );
});
