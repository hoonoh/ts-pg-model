import test from 'ava';
import { readFile } from 'fs/promises';
import MockDate from 'mockdate';
import { resolve } from 'path';
import { Project, SourceFile } from 'ts-morph';

import { MockFs } from '../../test/helpers/mock-fs.js';
import { TitleHelper } from '../../test/helpers/title.js';
import { serialAfterEach } from '../../test/init.js';
import { saveProject, startProject } from './ts-morph.js';

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

    let project: Project | undefined;
    let sourceFile: SourceFile | undefined;
    let prevSource: string | undefined;

    const addImport = (sf: SourceFile) => {
      sf.addImportDeclaration({ moduleSpecifier: 'test-module' });
    };

    ({ project, sourceFile, prevSource } = await startProject(testFilePath));
    addImport(sourceFile);
    await saveProject({ project, sourceFile, prevSource });

    const testFileSourceFirst = await readFile(testFilePath, { encoding: 'utf-8' });

    // do same routine with different date
    MockDate.set('2000-01-02');
    ({ project, sourceFile, prevSource } = await startProject(testFilePath));
    addImport(sourceFile);
    await saveProject({ project, sourceFile, prevSource });

    const testFileSourceSecond = await readFile(testFilePath, { encoding: 'utf-8' });

    t.deepEqual(testFileSourceFirst, testFileSourceSecond);
  },
);
