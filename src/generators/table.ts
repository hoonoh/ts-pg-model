import assert from 'assert';
import { pascalCase } from 'change-case';
import { OptionalKind, PropertySignatureStructure } from 'ts-morph';

import { ColumnTypeMap, Config, Table } from '../config/types/config.js';
import { resolveOutputPath } from './helpers/output-path.js';
import { saveProject, startProject } from './helpers/ts-morph.js';

export const generateTableFile = async (config: Config) => {
  const targets: [
    schema: string,
    tableName: string,
    tableSpec: Table & { columns: Record<string, ColumnTypeMap> },
  ][] = [];
  Object.entries(config.renderTargets).forEach(([schema, table]) => {
    Object.entries(table).forEach(([tableName, tableSpec]) => {
      Object.entries(tableSpec.columns).forEach(([columnNameRaw, column]) => {
        const columnName = config.conventions.columns(columnNameRaw);
        if (columnName !== columnNameRaw) {
          tableSpec.columns[columnName] = column;
          delete tableSpec.columns[columnNameRaw];
        }
      });
      targets.push([schema, pascalCase(tableName), tableSpec]);
    });
  });

  await Promise.all(
    targets.map(async ([schema, tableName, tableSpec]) => {
      const outputPath = resolveOutputPath({
        schema,
        filename: `${config.conventions.paths(tableName)}.ts`,
        config,
      });
      const { project, sourceFile } = startProject(outputPath);

      // for enum / composite type imports
      const importTypes: Record<
        string,
        Record<'enum' | 'composite', { name: string; type: ColumnTypeMap['type'] }[]>
      > = {};

      const tableDocs = [
        `@table ${tableSpec.schema}.${tableSpec.tableName}`,
        `@schema ${tableSpec.schema}`,
        `@name ${tableSpec.tableName}`,
      ];
      if (tableSpec.comment) tableDocs.push(`@comment ${tableSpec.comment}`);

      sourceFile.addInterface({
        isExported: true,
        name: pascalCase(tableName),
        docs: [tableDocs.join('\n')],
        properties: Object.entries(tableSpec.columns).reduce((acc, [columnName, columnSpec]) => {
          if (config.ignoreCompositeTypeColumns && columnSpec.type.composite) return acc;

          let type: string | undefined = columnSpec.type.ts;

          if (columnSpec.type.enum) {
            type = pascalCase(columnSpec.type.enum.name);
          } else if (columnSpec.type.composite) {
            type = pascalCase(columnSpec.type.composite.name);
          } else if (columnSpec.type.json) {
            type = pascalCase(columnSpec.type.json.name);
            sourceFile.addImportDeclaration({
              namedImports: [columnSpec.type.json.name],
              moduleSpecifier: `../json-types${config.importSuffix}`,
            });
          }

          assert(type !== undefined, 'unexpected undefined column type');

          const typeSchema = columnSpec.type.enum?.schema || columnSpec.type.composite?.schema;
          if (typeSchema && !importTypes[typeSchema]) {
            importTypes[typeSchema] = {
              enum: [],
              composite: [],
            };
          }

          let columnType = `${columnSpec.dataType}`;
          if (columnSpec.type.enum) {
            columnType = `[enum] ${columnSpec.type.enum.schema}.${columnSpec.type.enum.name}`;
            importTypes[columnSpec.type.enum.schema].enum.push({
              name: columnSpec.type.enum.name,
              type: { enum: columnSpec.type.enum },
            });
          } else if (columnSpec.type.composite) {
            columnType = `[composite] ${columnSpec.type.composite.schema}.${columnSpec.type.composite.name}`;
            importTypes[columnSpec.type.composite.schema].composite.push({
              name: columnSpec.type.composite.name,
              type: { composite: columnSpec.type.composite },
            });
          }

          const docs = [
            `@column ${columnSpec.schema}.${columnSpec.tableName}.${columnSpec.columnName}`,
            `@name ${columnSpec.columnName}`,
            `@pgtype ${columnType}`,
          ];

          if (columnSpec.isNullable) {
            docs.push(`@nullable`);
            type += ' | null';
          }

          if (columnSpec.defaults !== undefined) {
            docs.push(`@default '${columnSpec.defaults}'`);
          }

          if (columnSpec.comment) {
            docs.push(`@comment '${columnSpec.comment}'`);
          }

          // indexes & constraints
          [...(tableSpec.indexes || []), ...(tableSpec.constraints || [])]
            .filter(
              c =>
                c.schema === columnSpec.schema &&
                c.tableName === columnSpec.tableName &&
                c.columnNames.includes(columnSpec.columnName),
            )
            .forEach(c => {
              docs.push(c.docs);
            });

          acc.push({
            name: columnName,
            type,
            hasQuestionToken: columnSpec.isNullable,
            docs: [docs.join('\n')],
          } as PropertySignatureStructure);

          return acc;
        }, [] as OptionalKind<PropertySignatureStructure>[]),
      });

      // enum / composite type imports
      Object.entries(importTypes).forEach(([typeSchema, type]) => {
        if (type.enum.length) {
          sourceFile.addImportDeclaration({
            moduleSpecifier:
              (typeSchema === schema ? `./` : `../${config.conventions.paths(typeSchema)}/`) +
              `enum-types${config.importSuffix}`,
            namedImports: type.enum.map(t => pascalCase(t.name)),
          });
        }
        if (type.composite.length) {
          sourceFile.addImportDeclaration({
            moduleSpecifier:
              (typeSchema === schema ? `./` : `../${config.conventions.paths(typeSchema)}/`) +
              `composite-types${config.importSuffix}`,
            namedImports: type.composite.map(t => pascalCase(t.name)),
          });
        }
      });

      await saveProject({ project, sourceFile });
    }),
  );
};
