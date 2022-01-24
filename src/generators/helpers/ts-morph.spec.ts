import test from 'ava';
import { readFile } from 'fs/promises';
import MockDate from 'mockdate';
import { resolve } from 'path';
import { SourceFile } from 'ts-morph';

import { Config } from '../../config/types/config.js';
import { MockFs } from '../../test/helpers/mock-fs.js';
import { TitleHelper } from '../../test/helpers/title.js';
import { serialAfterEach } from '../../test/init.js';
import { TsMorphHelper } from './ts-morph.js';

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

serialAfterEach(test);

test.serial(
  titleHelper.should(
    'keep old source file if previous and new sources match except generated date',
  ),
  async t => {
    MockFs.mockDirectory(generateRoot);

    const testFilePath = resolve(generateRoot, 'test.ts');

    const addImport = (sf: SourceFile) => {
      sf.addImportDeclaration({ moduleSpecifier: 'test-module' });
    };

    // TsMorphHelper only looks for tsConfig path value
    const config: Pick<Config, 'tsConfig'> = {
      tsConfig: new URL('../../../tsconfig.json', import.meta.url).pathname,
    };

    const firstRun = new TsMorphHelper(testFilePath, config as Config);
    addImport(firstRun.sourceFile);
    await firstRun.save();

    const firstRunResult = await readFile(testFilePath, { encoding: 'utf-8' });

    // do same routine with different date
    MockDate.set('2000-01-02');
    const secondRun = new TsMorphHelper(testFilePath, config as Config);
    addImport(secondRun.sourceFile);
    await secondRun.save();

    const testFileSourceSecond = await readFile(testFilePath, { encoding: 'utf-8' });

    t.deepEqual(firstRunResult, testFileSourceSecond);
  },
);
