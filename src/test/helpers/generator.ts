import { ColumnTypeMap, RenderTargets, Table } from '../../config';
import { PgConstraintsBare, PgEnumTypeBare, PgIndexBare } from '../../config/types/pg';
import { KnownPgType, knownPgTypeToTsTypesMap } from '../../config/types/type-map';
import { validateConstratints } from '../../config/validators/constraint';
import { TableAndColumn } from './../../config/types/config';
import { validateIndexes } from './../../config/validators/pg-index';

/**
 * helpers for generators
 */

export const renderTargetsToQueryRes = (renderTargets: RenderTargets) => {
  const tableAndColumns: TableAndColumn[] = [];
  const enums: PgEnumTypeBare[] = [];
  const indexes: PgIndexBare[] = [];
  const constraints: PgConstraintsBare[] = [];
  Object.entries(renderTargets).forEach(([schema, tableSpecs]) => {
    Object.entries(tableSpecs).forEach(([, tableSpec]) => {
      if (tableSpec.indexes?.length) {
        indexes.push(
          ...tableSpec.indexes.map(i => {
            return {
              schema,
              tableName: tableSpec.tableName,
              indexName: i.name,
              definition: i.definition,
            } as PgIndexBare;
          }),
        );
      }
      if (tableSpec.constraints?.length) {
        constraints.push(
          ...tableSpec.constraints.map(c => {
            let type = 'p';
            switch (c.type) {
              case 'PrimaryKey':
                type = 'p';
                break;
              case 'ForeignKey':
                type = 'f';
                break;
              case 'Unique':
                type = 'u';
                break;
              case 'Check':
                type = 'c';
                break;
              case 'Exclude':
                type = 'x';
                break;
              default:
                break;
            }
            return {
              schema,
              tableName: tableSpec.tableName,
              type,
              constraintName: c.name,
              definition: c.definition,
            } as PgConstraintsBare;
          }),
        );
      }
      Object.entries(tableSpec.columns).forEach(([, columnSpec]) => {
        if (columnSpec.type.enum) {
          const name = columnSpec.type.enum.name;
          columnSpec.type.enum.labels.forEach((label, idx) => {
            enums.push({
              schema,
              name,
              label,
              sortOrder: idx,
            });
          });
        }
        tableAndColumns.push({
          schema: columnSpec.schema,
          tableName: columnSpec.tableName,
          columnName: columnSpec.columnName,
          dataType: columnSpec.dataType,
          userDefinedUdtSchema: columnSpec.userDefinedUdtSchema,
          udtName: columnSpec.udtName,
          isNullable: columnSpec.isNullable,
          tableComment: tableSpec.comment,
          columnComment: columnSpec.comment,
          defaults: columnSpec.defaults,
        });
      });
    });
  });
  return { tableAndColumns, enums, indexes, constraints };
};

export const mockEnumColumn = ({
  schema,
  udtSchema,
  tableName,
  columnName,
  enumName,
  enumLabels,
  isNullable,
  defaults,
  comment,
}: {
  schema: string;
  udtSchema?: string;
  tableName: string;
  columnName: string;
  enumName: string;
  enumLabels: string[];
  isNullable?: boolean;
  defaults?: string | null;
  comment?: string;
}) => {
  const column: Record<string, ColumnTypeMap> = {
    [columnName]: {
      schema,
      tableName,
      columnName,
      isNullable: !!isNullable,
      defaults,
      userDefinedUdtSchema: udtSchema || schema,
      udtName: enumName,
      dataType: 'USER-DEFINED',
      type: {
        enum: {
          schema,
          name: enumName,
          labels: enumLabels,
        },
      },
      comment,
    },
  };
  return column;
};

export const mockColumn = ({
  schema,
  tableName,
  columnName,
  pgType,
  isNullable,
  defaults,
  comment,
}: {
  schema: string;
  tableName: string;
  columnName: string;
  pgType: KnownPgType;
  isNullable?: boolean;
  defaults?: string | null;
  comment?: string;
}) => {
  const column: Record<string, ColumnTypeMap> = {
    [columnName]: {
      schema,
      tableName,
      columnName,
      isNullable: !!isNullable,
      defaults,
      udtName: pgType,
      dataType: pgType,
      type: {
        ts: knownPgTypeToTsTypesMap[pgType],
      },
      comment,
    },
  };
  return column;
};

export const mockTable = ({
  schema,
  tableName,
  pgColumns,
  enumColumns,
  indexSpecs,
  constraintSpecs,
}: {
  schema: string;
  tableName: string;
  pgColumns?: Omit<Parameters<typeof mockColumn>[0], 'schema' | 'tableName'>[];
  enumColumns?: Omit<Parameters<typeof mockEnumColumn>[0], 'schema' | 'tableName'>[];
  // todo: add json types
  indexSpecs?: Omit<PgIndexBare, 'schema' | 'tableName'>[];
  constraintSpecs?: Omit<PgConstraintsBare, 'schema' | 'tableName'>[];
}) => {
  const columns = pgColumns?.reduce((acc, c) => {
    acc = {
      ...acc,
      ...mockColumn({
        schema,
        tableName,
        columnName: c.columnName,
        pgType: c.pgType,
        isNullable: c.isNullable,
        defaults: c.defaults,
        comment: c.comment,
      }),
    };
    return acc;
  }, {} as Record<string, ColumnTypeMap>);
  const enums = enumColumns?.reduce((acc, c) => {
    acc = {
      ...acc,
      ...mockEnumColumn({
        schema,
        tableName,
        columnName: c.columnName,
        udtSchema: c.udtSchema,
        enumName: c.enumName,
        enumLabels: c.enumLabels,
        isNullable: c.isNullable,
        defaults: c.defaults,
        comment: c.comment,
      }),
    };
    return acc;
  }, {} as Record<string, ColumnTypeMap>);

  const indexes = indexSpecs?.length
    ? validateIndexes(indexSpecs.map(s => ({ ...s, schema, tableName } as PgIndexBare)))
    : undefined;

  const constraints = constraintSpecs?.length
    ? validateConstratints(
        constraintSpecs.map(s => ({ ...s, schema, tableName } as PgConstraintsBare)),
      )
    : undefined;

  const rtn: Record<string, Table & { columns: Record<string, ColumnTypeMap> }> = {
    [tableName]: {
      schema,
      tableName,
      columns: {
        ...columns,
        ...enums,
      },
      indexes,
      constraints,
    },
  };
  return rtn;
};

export const mockSchema = ({
  schema,
  tableSpecs,
}: {
  schema: string;
  tableSpecs: {
    tableName: string;
    pgColumns?: Omit<Parameters<typeof mockColumn>[0], 'schema' | 'tableName'>[];
    enumColumns?: Omit<Parameters<typeof mockEnumColumn>[0], 'schema' | 'tableName'>[];
    // todo: add json types
    indexSpecs?: Omit<PgIndexBare, 'schema' | 'tableName'>[];
    constraintSpecs?: Omit<PgConstraintsBare, 'schema' | 'tableName'>[];
  }[];
}) => {
  const tables = tableSpecs.reduce((acc, t) => {
    acc = {
      ...acc,
      ...mockTable({
        schema,
        tableName: t.tableName,
        pgColumns: t.pgColumns,
        enumColumns: t.enumColumns,
        indexSpecs: t.indexSpecs,
        constraintSpecs: t.constraintSpecs,
      }),
    };
    return acc;
  }, {} as Record<string, Table & { columns: Record<string, ColumnTypeMap> }>);
  const rtn: Record<string, Record<string, Table & { columns: Record<string, ColumnTypeMap> }>> = {
    [schema]: {
      ...tables,
    },
  };
  return rtn;
};
