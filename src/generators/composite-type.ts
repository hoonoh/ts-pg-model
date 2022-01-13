import { pascalCase } from 'change-case';
import { OptionalKind, TypeAliasDeclarationStructure } from 'ts-morph';

import { ColumnTypeMap, Config } from '../config/types/config.js';
import { isPgCompositeType, isPgEnumType } from '../config/types/pg.js';
import { resolveOutputPath } from './helpers/output-path.js';
import { saveProject, startProject } from './helpers/ts-morph.js';

export const generateCompositeFiles = async (config: Config) => {
  await Promise.all(
    Object.entries(config.compositeTypes).map(async ([schema, compositeType]) => {
      const outputPath = resolveOutputPath({
        schema,
        filename: `${config.conventions.paths('composite-types')}.ts`,
        config,
      });
      const { project, sourceFile } = startProject(outputPath);

      // enum or composite types to import
      const importTypes: { schema: string; name: string; type: ColumnTypeMap['type'] }[] = [];
      const types: OptionalKind<TypeAliasDeclarationStructure>[] = [];

      Object.entries(compositeType).forEach(([pgCompositeNameRaw, pgComposite]) => {
        const pgCompositeName = pascalCase(pgCompositeNameRaw);
        types.push({
          name: pgCompositeName,
          isExported: true,
          docs: [`@compositeType ${schema}.${pgCompositeNameRaw}`],
          type: w => {
            w.write('{');
            const indent = 1;
            Object.entries(pgComposite.attributes).forEach(([name, value]) => {
              if (isPgEnumType(value)) {
                w.newLine()
                  .write(`${config.conventions.types(name)}: ${pascalCase(value.name)};`)
                  .indent(indent);
                if (!importTypes.find(i => i.schema === value.schema && i.name === value.name)) {
                  importTypes.push({
                    schema: value.schema,
                    name: value.name,
                    type: { enum: value },
                  });
                }
              } else if (isPgCompositeType(value)) {
                w.newLine()
                  .write(`${config.conventions.types(name)}: ${pascalCase(value.name)};`)
                  .indent(indent);
                if (!importTypes.find(i => i.schema === value.schema && i.name === value.name)) {
                  importTypes.push({
                    schema: value.schema,
                    name: value.name,
                    type: { composite: value },
                  });
                }
              } else {
                w.newLine()
                  .write(`${config.conventions.types(name)}: ${value};`)
                  .indent(indent);
              }
            });
            w.write('}');
          },
        });
      });

      types.forEach((t, idx) => {
        sourceFile.addTypeAlias(t).prependWhitespace(w => {
          if (idx > 0) w.newLine();
        });
      });

      const importTypesSorted = importTypes.reduce((acc, cur) => {
        if (!acc[cur.schema]) acc[cur.schema] = { composite: [], enum: [] };
        if (cur.type.enum) {
          acc[cur.schema].enum.push(cur);
        } else if (cur.type.composite && cur.type.composite.schema !== schema) {
          // only composite types of other schema should be imported
          acc[cur.schema].composite.push(cur);
        }
        return acc;
      }, {} as Record<string, Record<'enum' | 'composite', typeof importTypes>>);

      Object.entries(importTypesSorted).forEach(([typeSchema, type]) => {
        if (type.enum.length) {
          sourceFile.addImportDeclaration({
            moduleSpecifier:
              (typeSchema === schema ? `./` : `../${config.conventions.paths(typeSchema)}/`) +
              `enum-types${config.importSuffix}`,
            namedImports: type.enum.map(t => pascalCase(t.name)),
          });
        }
        if (type.composite.length) {
          // only composite types of other schema will be imported
          sourceFile.addImportDeclaration({
            moduleSpecifier:
              `../${config.conventions.paths(typeSchema)}/` +
              `composite-types${config.importSuffix}`,
            namedImports: type.composite.map(t => pascalCase(t.name)),
          });
        }
      });

      await saveProject({ project, sourceFile });
    }),
  );
};
