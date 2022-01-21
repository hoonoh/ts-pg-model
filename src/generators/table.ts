import assert from 'assert';
import { pascalCase } from 'change-case';
import { OptionalKind, PropertySignatureStructure, StructureKind } from 'ts-morph';

import { ColumnTypeMap, Config, Table } from '../config/types/config.js';
import { FileGenerator } from './generator.js';
import { resolveOutputPath } from './helpers/output-path.js';
import { TsMorphHelper } from './helpers/ts-morph.js';

export const generateTableFile: FileGenerator = async (config: Config) => {
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

  return Promise.all(
    targets.map(async ([schema, tableName, tableSpec]) => {
      const outputPath = resolveOutputPath({
        schema,
        filename: `${config.conventions.paths(tableName)}.ts`,
        config,
      });
      const tsMorph = new TsMorphHelper(outputPath);
      const sourceFile = tsMorph.sourceFile;

      // for enum / composite type imports
      const importTypes: Record<
        string,
        Record<'enum' | 'composite', { name: string; type: ColumnTypeMap['type'] }[]>
      > = {};

      // for custom pg-type imports
      const pgTypes = ['JsonType', 'Timestamp'] as const;
      const importPgTypes: Set<typeof pgTypes[number]> = new Set();

      const tableDocs = [`@table ${tableSpec.schema}.${tableSpec.tableName}`];
      if (tableSpec.comment) tableDocs.push(`@comment ${tableSpec.comment}`);
      tableDocs.push(
        ...(tableSpec.constraints?.filter(c => c.type === 'PrimaryKey').map(c => c.docs) || []),
      );
      tableDocs.push(
        ...(tableSpec.constraints?.filter(c => c.type === 'ForeignKey').map(c => c.docs) || []),
      );
      tableDocs.push(
        ...(tableSpec.constraints?.filter(c => c.type === 'Unique').map(c => c.docs) || []),
      );
      tableDocs.push(
        ...(tableSpec.constraints?.filter(c => c.type === 'Check').map(c => c.docs) || []),
      );
      tableDocs.push(
        ...(tableSpec.constraints?.filter(c => c.type === 'Exclude').map(c => c.docs) || []),
      );
      tableDocs.push(...(tableSpec.indexes?.map(c => c.docs) || []));

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
          } else if (type && pgTypes.includes(type as typeof pgTypes[number])) {
            importPgTypes.add(type as typeof pgTypes[number]);
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

          const docs = [`@column ${columnSpec.columnName}`, `@pgType ${columnType}`];

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
            trailingTrivia: w => w.newLine(),
            kind: StructureKind.PropertySignature,
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

      if (importPgTypes.size > 0) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: `ts-pg-model`,
          namedImports: Array.from(importPgTypes),
        });
      }

      await tsMorph.save();
      return tsMorph.sourcePath;
    }),
  );
};
