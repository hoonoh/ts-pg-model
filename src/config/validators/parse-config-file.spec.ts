import test from 'ava';

import { TitleHelper } from '../../test/helpers/title';
import { MockFs } from './../../test/helpers/mock-fs';
import { parseConfigFile } from './parse-config-file';

const titleHelper = new TitleHelper();

const configFilePath = '/temp/config.ts';

const commonJsonTypeMap = `
export interface JsonTypeMap extends Record<string, JsonType> {
  FooType: {
    foo: string;
    bar: number;
    baz: {
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

const commonExpect = [
  ['FooType', '{\nfoo: string;\nbar: number;\nbaz: {\nfoobar: number;\nbarbaz: string;\n};\n};'],
  ['BarType', '{\nbar: number;\nbaz: string;\n};'],
];

test.serial(titleHelper.should('parse named exports'), async t => {
  MockFs.mockString({
    [configFilePath]: `
      ${commonJsonTypeMap}
      ${commonConfig}`,
  });

  const res = parseConfigFile(configFilePath);
  t.deepEqual(res, commonExpect);
});

test.serial(titleHelper.should('parse default exports'), async t => {
  MockFs.mockString({
    [configFilePath]: `
      ${commonJsonTypeMap}
      ${commonConfig}
      export default userConfig;
    `,
  });

  const res = parseConfigFile(configFilePath);
  t.deepEqual(res, commonExpect);
});

test.serial(titleHelper.throwsWhen('JsonTypeDefinitions argument unset'), async t => {
  MockFs.mockString({
    [configFilePath]: `
      export const userConfig: UserConfig = {
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
      `,
  });

  t.throws(() => parseConfigFile(configFilePath));
});

test.serial(titleHelper.throwsWhen('no user configuration is found'), async t => {
  MockFs.mockString({
    [configFilePath]: ``,
  });

  t.throws(() => parseConfigFile(configFilePath));
});
