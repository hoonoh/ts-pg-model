import { Column, ColumnTypeMap, RenderTargets, Table } from '../../config';
import { PgEnumTypeBare } from '../../config/types/pg';
import { KnownPgType, knownPgTypeToTsTypesMap } from '../../config/types/type-map';

/**
 * helpers for generators
 */

export const renderTargetsToQueryRes = (renderTargets: RenderTargets) => {
  const columns: Column[] = [];
  const enums: PgEnumTypeBare[] = [];
  Object.entries(renderTargets).forEach(([schema, tableSpecs]) => {
    Object.entries(tableSpecs).forEach(([, tableSpec]) => {
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
        columns.push({
          schema: columnSpec.schema,
          tableName: columnSpec.tableName,
          columnName: columnSpec.columnName,
          dataType: columnSpec.dataType,
          userDefinedUdtSchema: columnSpec.userDefinedUdtSchema,
          udtName: columnSpec.udtName,
          isNullable: columnSpec.isNullable,
          tableComment: columnSpec.tableComment,
          defaults: columnSpec.defaults,
        });
      });
    });
  });
  return { columns, enums };
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
  columnComment,
}: {
  schema: string;
  udtSchema?: string;
  tableName: string;
  columnName: string;
  enumName: string;
  enumLabels: string[];
  isNullable?: boolean;
  defaults?: string | null;
  columnComment?: string;
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
      columnComment,
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
  columnComment,
}: {
  schema: string;
  tableName: string;
  columnName: string;
  pgType: KnownPgType;
  isNullable?: boolean;
  defaults?: string | null;
  columnComment?: string;
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
      columnComment,
    },
  };
  return column;
};

export const mockTable = ({
  schema,
  tableName,
  pgColumns,
  enumColumns,
}: {
  schema: string;
  tableName: string;
  pgColumns?: Omit<Parameters<typeof mockColumn>[0], 'schema' | 'tableName'>[];
  enumColumns?: Omit<Parameters<typeof mockEnumColumn>[0], 'schema' | 'tableName'>[];
  // todo: add json types
}) => {
  const columns = pgColumns?.reduce((acc, c) => {
    acc = {
      ...acc,
      ...mockColumn({
        schema,
        tableName,
        columnName: c.columnName,
        pgType: c.pgType,
        defaults: c.defaults,
        isNullable: c.isNullable,
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
      }),
    };
    return acc;
  }, {} as Record<string, ColumnTypeMap>);
  const rtn: Record<string, Table & { columns: Record<string, ColumnTypeMap> }> = {
    [tableName]: {
      schema,
      tableName,
      columns: {
        ...columns,
        ...enums,
      },
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
