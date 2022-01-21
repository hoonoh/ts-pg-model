import test from 'ava';
import { mkdir, readdir, readFile, rmdir, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { resolve } from 'path';

import { tableAndColumnsQuery } from '../config/querries.js';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator.js';
import { mockPool } from '../test/helpers/mock-pool.js';
import { TitleHelper } from '../test/helpers/title.js';
import { cli } from './cli.js';

const titleHelper = new TitleHelper();

// since esbuild runtime won't allow fs mocks, use tmpdir instead
const tmpRoot = resolve(tmpdir(), `ts-pg-model-test`);

const addTmpPath = async () => {
  await stat(tmpRoot).catch(async () => mkdir(tmpRoot));
  const rand = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  const tmpPath = resolve(tmpRoot, rand);
  await mkdir(tmpPath);
  return tmpPath;
};

test.after(async () => {
  await rmdir(tmpRoot, { recursive: true });
});

test(titleHelper.should('should generate for single schema setup'), async t => {
  const root = await addTmpPath();
  const generateRoot = resolve(root, 'generated');

  const { tableAndColumns } = renderTargetsToQueryRes({
    ...mockSchema({
      schema: 'foo',
      tableSpecs: [
        {
          tableName: 'bar',
          pgColumns: [
            {
              columnName: 'bar_text',
              pgType: 'text',
            },
            {
              columnName: 'bar_jsonb',
              pgType: 'jsonb',
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

  const configPath = resolve(root, 'config.ts');

  const configSource = `
import { Config } from 'ts-pg-model';

interface JsonTypeMap {
  FooType: {
    foo: string;
    bar: number;
    baz: {
      foobar: number;
      barbaz: string;
    };
  };
}

export const userConfig: Config<JsonTypeMap> = {
  schemas: ['foo'],
  typeMap: {
    json: [
      {
        schema: 'foo',
        tableName: 'bar',
        columnName: 'bar_jsonb',
        name: 'FooType',
      },
    ],
  },
  output: {
    root: '${generateRoot}',
  },
};
`;

  await writeFile(configPath, configSource);

  await cli(configPath, { pool, silent: true, skipProcessExit: true });

  const rootFiles = await readdir(generateRoot);
  const expectedFiles = ['bar.ts', 'json-types.ts'];

  t.deepEqual(rootFiles.sort(), expectedFiles.sort());

  t.snapshot(configSource, 'config.ts');

  await Promise.all(
    expectedFiles.map(async p => {
      t.true(rootFiles.includes(p));
      const fullPath = resolve(generateRoot, p);
      const source = await readFile(fullPath, { encoding: 'utf-8' });
      t.snapshot(source, fullPath.replace(`${root}/`, ''));
    }),
  );
});
