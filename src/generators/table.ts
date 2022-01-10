import assert from 'assert';
import { pascalCase } from 'change-case';
import { PropertySignatureStructure } from 'ts-morph';

import { ColumnTypeMap, Config, Table } from '../config';
import { resolveOutputPath } from './helpers/output-path';
import { startProject } from './helpers/ts-morph';

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
      targets.push([config.conventions.schemas(schema), pascalCase(tableName), tableSpec]);
    });
  });

  await Promise.all(
    targets.map(async ([schema, tableName, tableSpec]) => {
      const outputPath = resolveOutputPath({ schema, filename: `${tableName}.ts`, config });
      const { project, sourceFile } = startProject(outputPath);

      const importEnumType = Object.entries(tableSpec.columns).reduce((acc, [, columnSpec]) => {
        if (columnSpec.type.enum) acc.push(columnSpec);
        return acc;
      }, [] as ColumnTypeMap[]);

      const enumTypeNames = importEnumType.map(i => i.type.enum?.name || 'UNEXPECTED');

      enumTypeNames.forEach(n => assert(n !== 'UNEXPECTED', 'unexpected enum type name'));

      sourceFile.addImportDeclaration({
        namedImports: enumTypeNames.map(n => pascalCase(n)),
        moduleSpecifier: `./${config.conventions.paths('enum-types')}.ts`,
      });

      const tableDocs = [
        `- schema: \`${tableSpec.schema}\``,
        `- table name: \`${tableSpec.tableName}\``,
        // `table comment: ${}` // todo: add table comment to tableSpec table type
      ];

      sourceFile.addInterface({
        isExported: true,
        name: pascalCase(tableName),
        docs: [tableDocs.join('\n')],
        properties: Object.entries(tableSpec.columns).map(([columnName, columnSpec]) => {
          let type = columnSpec.type.enum
            ? pascalCase(columnSpec.type.enum.name)
            : columnSpec.type.ts;
          assert(type !== undefined, 'unexpected undefined column type');

          let columnType = `\`${columnSpec.dataType}\``;
          if (columnSpec.type.enum) {
            columnType = `[Enum] \`${columnSpec.type.enum.schema}.${columnSpec.type.enum.name}\``;
          }
          const docs = [
            `${columnSpec.schema}.${columnSpec.tableName}.${columnSpec.columnName}`,
            `- column name: \`${columnSpec.columnName}\``,
            `- column type: ${columnType}`,
          ];

          if (columnSpec.isNullable) {
            docs.push(`- nullable: \`true\``);
            type += ' | null';
          }

          if (columnSpec.defaults !== undefined) {
            docs.push(`- defaults: \`${columnSpec.defaults}\``);
          }

          /**
           * todo: add following to jsdocs
           * - indices
           * - fk / pk / unique constraints
           * - comments
           */

          return {
            name: columnName,
            type,
            hasQuestionToken: columnSpec.isNullable,
            docs: [docs.join('\n')],
          } as PropertySignatureStructure;
        }),
      });

      await project.save();
    }),
  );
};
