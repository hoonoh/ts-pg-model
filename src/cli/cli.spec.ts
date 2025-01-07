import test from 'ava';
import { mkdir, readdir, readFile, rmdir, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { resolve } from 'path';
import sinon from 'sinon';

import { tableAndColumnsQuery } from '../config/querries.js';
import { connectionURI } from '../test/constants.js';
import { mockSchema, renderTargetsToQueryRes } from '../test/helpers/generator.js';
import { mockPool } from '../test/helpers/mock-pool.js';
import { TitleHelper } from '../test/helpers/title.js';
import cli from './cli.js';

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

test.serial.after(async () => {
  try {
    await rmdir(tmpRoot, { recursive: true });
  } catch (error) {
    //
  }
});

test.serial(titleHelper.should('generate single schema setup & remove unused files'), async t => {
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

  const pool = await mockPool(
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
  connectionURI: '${connectionURI}',
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

  // unused files
  await mkdir(generateRoot, { recursive: true });
  const unusedFiles = [resolve(generateRoot, 'file-a.ts'), resolve(generateRoot, 'file-b.ts')];
  await Promise.all(unusedFiles.map(async p => writeFile(p, '// unused')));

  await cli.run(configPath, {
    pool,
    silent: true,
    skipProcessExit: true,
    configTranspilePath: resolve(root, 'config.mjs'),
  });

  const rootFiles = await readdir(generateRoot);
  const expectedFiles = ['bar.ts', 'json-types.ts'];

  t.deepEqual(rootFiles.sort(), expectedFiles.sort());

  t.snapshot(configSource.replaceAll(`${root}/`, ''), 'config.ts');

  await Promise.all(
    expectedFiles.map(async p => {
      t.true(rootFiles.includes(p));
      const fullPath = resolve(generateRoot, p);
      const source = await readFile(fullPath, { encoding: 'utf-8' });
      t.snapshot(source, fullPath.replace(`${root}/`, ''));
    }),
  );

  // check unused files removal
  await Promise.all(unusedFiles.map(async p => t.throwsAsync(async () => stat(p))));
});

test.serial(titleHelper.should('fail on invalid setup file path'), async t => {
  const root = await addTmpPath();
  const spy = sinon.spy(cli, 'exit');

  await cli.run(resolve(root, 'invalid/path.ts'), {
    silent: true,
    skipProcessExit: true,
    configTranspilePath: resolve(root, 'config.mjs'),
  });

  t.true(spy.calledOnce);
  t.true(spy.calledWith({ code: 1, skipProcessExit: true }));

  spy.restore();
});

test.serial(titleHelper.should('fail on setup file without valid config setup'), async t => {
  const root = await addTmpPath();
  const configPath = resolve(root, 'config.ts');
  await writeFile(configPath, '// empty');

  const spy = sinon.spy(cli, 'exit');

  await cli.run(configPath, {
    silent: true,
    skipProcessExit: true,
    configTranspilePath: resolve(root, 'config.mjs'),
  });

  t.true(spy.calledOnce);
  t.true(
    spy.calledWith({
      configTranspilePath: resolve(root, 'config.mjs'),
      code: 1,
      skipProcessExit: true,
    }),
  );

  spy.restore();
});
