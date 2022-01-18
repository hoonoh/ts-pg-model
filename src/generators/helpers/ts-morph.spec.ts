import test from 'ava';
import { readFile } from 'fs/promises';
import MockDate from 'mockdate';
import { resolve } from 'path';
import { SourceFile } from 'ts-morph';

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

    const firstRun = new TsMorphHelper(testFilePath);
    addImport(firstRun.sourceFile);
    await firstRun.save();

    const firstRunResult = await readFile(testFilePath, { encoding: 'utf-8' });

    // do same routine with different date
    MockDate.set('2000-01-02');
    const secondRun = new TsMorphHelper(testFilePath);
    addImport(secondRun.sourceFile);
    await secondRun.save();

    const testFileSourceSecond = await readFile(testFilePath, { encoding: 'utf-8' });

    t.deepEqual(firstRunResult, testFileSourceSecond);
  },
);
