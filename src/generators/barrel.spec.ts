import test from 'ava';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { validateUserConfig } from '../config/validators/user-config.js';
import { connectionURI } from '../test/constants.js';
import { MockFs } from '../test/helpers/mock-fs.js';
import { TitleHelper } from '../test/helpers/title.js';
import { serialAfterEach } from '../test/init.js';
import { generateBarrel } from './barrel.js';
import { generateCompositeFiles } from './composite-type.js';
import { generateEnumFiles } from './enum-type.js';
import { generateJsonTypeFile } from './json-type.js';
import { generateTableFile } from './table.js';

serialAfterEach(test);

const generateRoot = resolve('/test', 'generated');
const titleHelper = new TitleHelper();

test.serial(titleHelper.should('barrel files in multi schema mode'), async t => {
  MockFs.mockDirectory(generateRoot);

  const config = await validateUserConfig({
    connectionURI,
    schemas: ['users', 'media'],
    output: { root: generateRoot, includeSchemaPath: true },
    conventions: { columns: 'camelCase' },
  });

  await generateEnumFiles(config);
  await generateCompositeFiles(config);
  await generateJsonTypeFile(config);
  await generateTableFile(config);

  await generateBarrel(config);

  const rootFiles = readdirSync(generateRoot);
  const generatedFilePaths: string[] = [];
  rootFiles.forEach(schema => {
    const schemaRoot = resolve(generateRoot, schema);
    if (lstatSync(schemaRoot).isDirectory()) {
      readdirSync(schemaRoot).forEach(f => {
        const filePath = resolve(schemaRoot, f);
        if (filePath.endsWith('/index.ts')) {
          generatedFilePaths.push(filePath);
          t.snapshot(readFileSync(filePath, { encoding: 'utf-8' }), `${schema} - ${filePath}`);
        }
      });
    }
  });
  t.deepEqual(generatedFilePaths, [
    '/test/generated/media/index.ts',
    '/test/generated/public/index.ts',
    '/test/generated/users/index.ts',
  ]);
});
