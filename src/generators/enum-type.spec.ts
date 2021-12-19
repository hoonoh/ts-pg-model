import test from 'ava';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { pascalCase } from 'pascal-case';
import { resolve } from 'path';

import { validateUserConfig } from '../config';
import { enumTypesBareQuery } from '../config/querries';
import { PgEnumTypeBare } from '../config/types/pg';
import { connectionURI } from '../test/constants';
import { MockFs } from '../test/helpers/mock-fs';
import { defaultMockPool, mockPool } from '../test/helpers/mock-pool';
import { TitleHelper } from '../test/helpers/title';
import { generateEnumFiles } from './enum-type';

const generateRoot = resolve('/test', 'generated');
// const generateRoot = resolve('/', 'generated');

test.serial.afterEach(() => {
  MockFs.restore();
});

const titleHelper = new TitleHelper();

test.serial(titleHelper.should('generate enum files as expected'), async t => {
  const enumFoo: PgEnumTypeBare[] = [
    {
      schema: 'foo',
      name: 'bar',
      label: 'fooBarLabel1',
      sortOrder: 1,
    },
    {
      schema: 'foo',
      name: 'bar',
      label: 'fooBarLabel2',
      sortOrder: 2,
    },
    {
      schema: 'foo',
      name: 'bar',
      label: 'fooBarLabel3',
      sortOrder: 3,
    },
  ];

  const enumBar: PgEnumTypeBare[] = [
    {
      schema: 'bar',
      name: 'baz',
      label: 'barBazLabel1',
      sortOrder: 1,
    },
    {
      schema: 'bar',
      name: 'baz',
      label: 'barBazLabel2',
      sortOrder: 2,
    },
    {
      schema: 'bar',
      name: 'baz',
      label: 'barBazLabel3',
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
  ]);

  const config = await validateUserConfig({
    connectionURI,
    output: { root: generateRoot, includeSchemaPath: true },
    pool,
  });

  await generateEnumFiles(config);

  // check each schema directories created
  const enumFiles = readdirSync(generateRoot);
  t.true(enumFiles.length === defaultMockPool.schemas.length);
  readdirSync(generateRoot).forEach(p => t.true(defaultMockPool.schemas.includes(p)));

  defaultMockPool.schemas.forEach(s => {
    // check directory path
    t.is(lstatSync(resolve(generateRoot, s)).isDirectory(), true);
    // check each enum files
    const enumFilePath = resolve(generateRoot, s, 'enum-types.ts');
    t.notThrows(() => readFileSync(enumFilePath).toString());
    const enumFile = readFileSync(enumFilePath).toString();
    if (s === 'foo') {
      enumFoo.forEach(e => t.true(enumFile.includes(`${e.label} = "${e.label}"`)));
      t.true(enumFile.includes(`export enum ${pascalCase(enumFoo[0].name)}`));
    } else {
      enumBar.forEach(e => t.true(enumFile.includes(`${e.label} = "${e.label}"`)));
      t.true(enumFile.includes(`export enum ${pascalCase(enumBar[0].name)}`));
    }
  });
});
