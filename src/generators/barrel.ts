import { paramCase, pascalCase } from 'change-case';
import { lstatSync } from 'fs';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { ModuleDeclarationKind } from 'ts-morph';

import { Config } from '../config/types/config.js';
import { FileGenerator } from './generator.js';
import { TsMorphHelper } from './helpers/ts-morph.js';

export const generateBarrel: FileGenerator = async (config: Config) => {
  const schemaRoots = (await readdir(config.output.root)).filter(p =>
    lstatSync(resolve(config.output.root, p)).isDirectory(),
  );
  return Promise.all(
    schemaRoots.map(async schema => {
      const schemaPath = resolve(config.output.root, schema);
      const files = await readdir(schemaPath);
      const tsMorph = new TsMorphHelper(resolve(schemaPath, 'index.ts'));
      const sourceFile = tsMorph.sourceFile;

      const enumTypeNames: string[] = [];
      const compositeTypeNames: string[] = [];
      const tableNames: string[] = [];

      await Promise.all(
        files.map(async filename => {
          const filenameNormalize = paramCase(filename.split('.').shift() || '');
          if (
            // enum type file
            filenameNormalize === 'enum-types' &&
            config.enumTypes[schema]
          ) {
            enumTypeNames.push(...Object.keys(config.enumTypes[schema]).map(n => pascalCase(n)));
          } else if (
            // composite type file
            filenameNormalize === 'composite-types' &&
            config.compositeTypes[schema]
          ) {
            compositeTypeNames.push(
              ...Object.keys(config.compositeTypes[schema]).map(n => pascalCase(n)),
            );
          } else {
            // table file
            tableNames.push(pascalCase(filenameNormalize));
          }
        }),
      );

      sourceFile.addImportDeclaration({
        moduleSpecifier: `./${config.conventions.paths('enum-types')}${config.importSuffix}`,
        namedImports: enumTypeNames.map(n => `${n} as _${n}`),
      });
      sourceFile.addImportDeclaration({
        moduleSpecifier: `./${config.conventions.paths('composite-types')}${config.importSuffix}`,
        namedImports: compositeTypeNames.map(n => `${n} as _${n}`),
      });
      tableNames.forEach(tableName => {
        sourceFile.addImportDeclaration({
          moduleSpecifier: `./${config.conventions.paths(tableName)}${config.importSuffix}`,
          defaultImport: `* as _${tableName}`,
        });
      });

      sourceFile.addModule({
        isExported: true,
        // since public is typescript reserved word...
        name: config.conventions.schemas(schema === 'public' ? 'pgPublic' : schema),
        declarationKind: ModuleDeclarationKind.Namespace,
        statements: [
          ...enumTypeNames.map(n => `export import ${n} = _${n};`),
          ...compositeTypeNames.map(n => `export type ${n} = _${n};`),
          ...tableNames.map(n => `export import ${n} = _${n};`),
        ],
        docs: [`@schema: ${schema}`],
      });

      await tsMorph.save();

      return tsMorph.sourcePath;
    }),
  );
};
