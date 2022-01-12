import assert from 'assert';
import { pascalCase } from 'change-case';
import { PropertySignatureStructure } from 'ts-morph';

import { ColumnTypeMap, Config, Table } from '../config/index.js';
import { resolveOutputPath } from './helpers/output-path.js';
import { startProject } from './helpers/ts-morph.js';

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
        `@table ${tableSpec.schema}.${tableSpec.tableName}`,
        `@schema ${tableSpec.schema}`,
        `@name ${tableSpec.tableName}`,
      ];
      if (tableSpec.comment) tableDocs.push(`@comment ${tableSpec.comment}`);

      sourceFile.addInterface({
        isExported: true,
        name: pascalCase(tableName),
        docs: [tableDocs.join('\n')],
        properties: Object.entries(tableSpec.columns).map(([columnName, columnSpec]) => {
          let type: string | undefined = columnSpec.type.ts;

          if (columnSpec.type.enum) {
            type = pascalCase(columnSpec.type.enum.name);
          } else if (columnSpec.type.composite) {
            type = pascalCase(columnSpec.type.composite.name);
          }
          assert(type !== undefined, 'unexpected undefined column type');

          let columnType = `${columnSpec.dataType}`;
          if (columnSpec.type.enum) {
            columnType = `[enum] ${columnSpec.type.enum.schema}.${columnSpec.type.enum.name}`;
          } else if (columnSpec.type.composite) {
            columnType = `[composite] ${columnSpec.type.composite.schema}.${columnSpec.type.composite.name}`;
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
