import test from 'ava';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { tableAndColumnsQuery } from '../config/querries.js';
import { parseConfigFile } from '../config/validators/parse-config-file.js';
import { validateUserConfig } from '../config/validators/user-config.js';
import { connectionURI } from '../test/constants.js';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator.js';
import { MockFs } from '../test/helpers/mock-fs.js';
import { mockPool } from '../test/helpers/mock-pool.js';
import { TitleHelper } from '../test/helpers/title.js';
import { serialAfterEach } from '../test/init.js';
import { generateJsonTypeFile } from './json-type.js';

serialAfterEach(test);

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

  const pool = await mockPool(
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

  t.snapshot(jsonTypeFile);
});
