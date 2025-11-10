import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
} from 'change-case';
import { DeepRequired } from 'ts-essentials';
import z from 'zod';

import { JsonType } from '../../pg-types/json.js';
import { PgCompositeType, PgCompositeTypes, PgEnumType, PgEnumTypes } from './pg.js';
import { KnownPgType, knownPgTypesZod, TsType } from './type-map.js';

export type ConfigKey = 'schemas' | 'tables' | 'columns' | 'types';

export type ConnectionURI = `${'postgres' | 'postgresql'}://${string}`;

export const isConnectionURI = (str: string): str is ConnectionURI => {
  return str.startsWith('postgres://') || str.startsWith('postgresql://');
};

export type ChangeCase =
  | 'camelCase'
  | 'capitalCase'
  | 'constantCase'
  | 'dotCase'
  | 'kebabCase'
  | 'noCase'
  | 'pascalCase'
  | 'pathCase'
  | 'sentenceCase'
  | 'snakeCase'
  | 'trainCase'
  | 'keep';

export const changeCaseMap: Record<ChangeCase, (input: string) => string> = {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
  keep: (input: string) => input,
} as const;

type NonEmptyArray<T> = [T, ...T[]];

export type TargetSelector =
  | (Partial<Record<Extract<ConfigKey, 'columns'>, NonEmptyArray<string>>> &
      Record<Extract<ConfigKey, 'tables'>, NonEmptyArray<string>>)
  | (Partial<Record<Extract<ConfigKey, 'tables'>, NonEmptyArray<string>>> &
      Record<Extract<ConfigKey, 'columns'>, NonEmptyArray<string>>);

export type IncludeTargets = { include: TargetSelector };
export type ExcludeTargets = { exclude: TargetSelector };

export const isIncludeTargets = (target: any): target is IncludeTargets => {
  return Object.keys(target).includes('include');
};

/**
 * {
 *  [udt_name]: TsType
 * }
 */
export type UdtTypeMap = Record<string, TsType>;

export type JsonTypeMap<K> = ColumnBare & { name: K };

export type JsonTypeBareDefinitions = [name: string, definition: string][];

export type TypeMap<
  JsonTypeDefinitions extends Record<K, JsonType> = Record<any, JsonType>,
  K extends keyof JsonTypeDefinitions = keyof JsonTypeDefinitions,
> = {
  udt?: UdtTypeMap;
  json?: JsonTypeMap<K>[];
  jsonDefinitions?: JsonTypeBareDefinitions;
};

export type UserConfig<
  JsonTypeDefinitions extends Record<K, JsonType> = Record<any, JsonType>,
  K extends keyof JsonTypeDefinitions = keyof JsonTypeDefinitions,
> = {
  connectionURI?: ConnectionURI;
  dotEnvPath?: string;
  conventions?: Partial<Record<Exclude<ConfigKey, 'tables'> | 'paths', ChangeCase>>;
  schemas?: string[];
  targetSelectors?: (IncludeTargets | ExcludeTargets)[];
  typeMap?: TypeMap<JsonTypeDefinitions>;
  output?: {
    root?: string;
    includeSchemaPath?: boolean;
    keepFiles?: string[];
  };
  ignoreCompositeTypeColumns?: boolean;
  tsConfig?: string;
};

export const tableAndColumnZod = z.object({
  schema: z.string(),
  tableName: z.string(),
  columnName: z.string(),
  dataType: knownPgTypesZod.or(z.literal('USER-DEFINED')),
  userDefinedUdtSchema: z.nullable(z.optional(z.string())),
  udtName: z.string(),
  isNullable: z.boolean(),
  tableComment: z.nullable(z.optional(z.string())),
  columnComment: z.nullable(z.optional(z.string())),
  defaults: z.nullable(z.optional(z.string())),
});

export type TableAndColumn = z.infer<typeof tableAndColumnZod>;

export type Index = {
  schema: string;
  tableName: string;
  name: string;
  definition: string;
  isUnique: boolean;
  using: string;
  columnNames: string[];
  docs: string;
};

export type Constraint = {
  schema: string;
  tableName: string;
  name: string;
  type: 'PrimaryKey' | 'ForeignKey' | 'Unique' | 'Check' | 'Exclude' | 'NotNull';
  definition: string;
  columnNames: string[];
  docs: string;
};

export type Table = {
  schema: string;
  tableName: string;
  comment?: string;
  columns: Record<string, Column>;
  indexes?: Index[];
  constraints?: Constraint[];
};

export type TableBare = Omit<Table, 'columns'>;

export type Column = {
  schema: string;
  tableName: string;
  columnName: string;
  dataType: KnownPgType | 'USER-DEFINED';
  userDefinedUdtSchema?: string | null;
  udtName: string;
  isNullable: boolean;
  comment?: string | null;
  defaults?: string | null;
};

export type ColumnTypeMap = Column & {
  type:
    | {
        ts: TsType;
        json?: undefined;
        enum?: undefined;
        composite?: undefined;
      }
    | {
        ts?: undefined;
        json: JsonTypeMap<string>;
        enum?: undefined;
        composite?: undefined;
      }
    | {
        ts?: undefined;
        json?: undefined;
        enum: PgEnumType;
        composite?: undefined;
      }
    | {
        ts?: undefined;
        json?: undefined;
        enum?: undefined;
        composite: PgCompositeType;
      };
};

export type ColumnBare = Pick<Column, 'schema' | 'tableName' | 'columnName' | 'comment'>;

export type RenderTargets = Record<
  string,
  Record<string, Table & { columns: Record<string, ColumnTypeMap> }>
>;

export type Config = Required<
  Pick<UserConfig, 'connectionURI' | 'schemas' | 'ignoreCompositeTypeColumns' | 'tsConfig'>
> &
  DeepRequired<Pick<UserConfig, 'output'> & { output: { existingFilePaths: string[] } }> &
  Omit<UserConfig, 'dotEnvPath' | 'targetSelectors' | 'conventions'> & {
    renderTargets: RenderTargets;
    enumTypes: PgEnumTypes;
    compositeTypes: PgCompositeTypes;
    conventions: Record<Exclude<ConfigKey, 'tables'> | 'paths', (input: string) => string>;
    typeMap?: TypeMap;
    importSuffix: string;
  };
