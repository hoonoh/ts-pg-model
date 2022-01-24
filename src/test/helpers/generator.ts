import { ColumnTypeMap, RenderTargets, Table, TableAndColumn } from '../../config/types/config.js';
import {
  isPgCompositeType,
  isPgEnumType,
  PgCompositeType,
  PgCompositeTypeBare,
  PgConstraintsBare,
  PgEnumType,
  PgEnumTypeBare,
  PgIndexBare,
} from '../../config/types/pg.js';
import { KnownPgType, knownPgTypeToTsTypesMap, TsType } from '../../config/types/type-map.js';
import { validateConstratints } from '../../config/validators/constraint.js';
import { validateIndexes } from './../../config/validators/pg-index.js';

/**
 * helpers for generators
 */

export const renderTargetsToQueryRes = (renderTargets: RenderTargets) => {
  const tableAndColumns: TableAndColumn[] = [];
  const enums: PgEnumTypeBare[] = [];
  const compositeTypes: PgCompositeTypeBare[] = [];
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
        if (columnSpec.type.composite) {
          const { name } = columnSpec.type.composite;
          Object.entries(columnSpec.type.composite.attributes).forEach(
            ([attributeName, attr], idx) => {
              const isEnum = isPgEnumType(attr);
              const isComposite = isPgCompositeType(attr);
              let userType: PgCompositeTypeBare['userType'] = null;
              if (isEnum) {
                userType = 'enum';
              } else if (isComposite) {
                userType = 'composite';
              }

              // ? limited accuracy
              let type: KnownPgType | string = 'text';
              if (isEnum || isComposite) {
                type = `${schema}.${attr.name}`;
              } else if (typeof attr === 'number') {
                type = 'int2' as KnownPgType;
              } else if (typeof attr === 'boolean') {
                type = 'bool' as KnownPgType;
              }

              compositeTypes.push({
                schema,
                name,
                sortOrder: idx,
                userType,
                type,
                attributeName,
              } as PgCompositeTypeBare);
            },
          );
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
  return { tableAndColumns, enums, compositeTypes, indexes, constraints };
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

export const mockCompositeColumn = ({
  schema,
  udtSchema,
  tableName,
  columnName,
  compositeTypeName,
  attributes,
  isNullable,
  defaults,
  comment,
}: {
  schema: string;
  udtSchema?: string;
  tableName: string;
  columnName: string;
  compositeTypeName: string;
  attributes: (
    | {
        type: 'ts';
        name: string;
        value: TsType;
      }
    | {
        type: 'enum';
        name: string;
        value: Omit<PgEnumType, 'schema'>;
      }
    | {
        type: 'composite';
        name: string;
        value: Omit<PgCompositeType, 'schema'>;
      }
  )[];
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
      udtName: compositeTypeName,
      dataType: 'USER-DEFINED',
      type: {
        composite: {
          schema,
          name: compositeTypeName,
          attributes: attributes.reduce((acc, cur) => {
            if (cur.type === 'ts') {
              acc[cur.name] = cur.value;
            } else if (cur.type === 'enum') {
              acc[cur.name] = {
                schema,
                ...cur.value,
              } as PgEnumType;
            } else if (cur.type === 'composite') {
              acc[cur.name] = {
                schema,
                ...cur.value,
              } as PgCompositeType;
            }
            return acc;
          }, {} as PgCompositeType['attributes']),
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
  compositeTypeColumns,
  indexSpecs,
  constraintSpecs,
}: {
  schema: string;
  tableName: string;
  pgColumns?: Omit<Parameters<typeof mockColumn>[0], 'schema' | 'tableName'>[];
  enumColumns?: Omit<Parameters<typeof mockEnumColumn>[0], 'schema' | 'tableName'>[];
  compositeTypeColumns?: Omit<Parameters<typeof mockCompositeColumn>[0], 'schema' | 'tableName'>[];
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

  const compositeTypes = compositeTypeColumns?.reduce((acc, c) => {
    acc = {
      ...acc,
      ...mockCompositeColumn({
        schema,
        tableName,
        columnName: c.columnName,
        udtSchema: c.udtSchema,
        compositeTypeName: c.compositeTypeName,
        attributes: c.attributes,
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
        ...compositeTypes,
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
    compositeTypeColumns?: Omit<
      Parameters<typeof mockCompositeColumn>[0],
      'schema' | 'tableName'
    >[];
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
        compositeTypeColumns: t.compositeTypeColumns,
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
