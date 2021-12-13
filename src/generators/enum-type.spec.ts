import test from 'ava';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { assertConfig } from '../config';
import { connectionURI } from '../test/constants';
import { MockFs } from '../test/mock-fs-helper';
import { TitleHelper } from '../test/title-helper';
import { generateEnumFiles } from './enum-type';

const generateRoot = resolve('/test', 'generated');
// const generateRoot = resolve('/', 'generated');

test.serial.afterEach(() => {
  MockFs.restore();
});

const titleHelper = new TitleHelper();

test.serial(titleHelper.should('generate enum files as expected'), async t => {
  MockFs.mockDirectory(generateRoot);

  const schemas = ['media', 'users'];

  const config = await assertConfig({
    connectionURI,
    schemas,
    output: { root: generateRoot },
  });

  await generateEnumFiles(config);

  // check each schema directories created
  t.deepEqual(schemas, readdirSync(generateRoot));

  schemas.forEach(s => {
    // check directory path
    t.is(lstatSync(resolve(generateRoot, s)).isDirectory(), true);
    // check each enum files
    const enumFilePath = resolve(generateRoot, s, 'enum-types.ts');
    t.snapshot(readFileSync(enumFilePath).toString(), enumFilePath);
  });

  t.is(true, true);
});
