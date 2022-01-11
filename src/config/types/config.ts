import {
  capitalCase,
  constantCase,
  dotCase,
  headerCase,
  noCase,
  paramCase,
  pascalCase,
  pathCase,
  sentenceCase,
} from 'change-case';
import { camelCase, snakeCase } from 'lodash';
import { DeepRequired } from 'ts-essentials';

import { JsonType } from '../../pg-types/json';
import { PgCompositeType, PgCompositeTypes, PgEnumType, PgEnumTypes } from './pg';
import { KnownPgType, TsType } from './type-map';

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
  | 'headerCase'
  | 'noCase'
  | 'paramCase'
  | 'pascalCase'
  | 'pathCase'
  | 'sentenceCase'
  | 'snakeCase'
  | 'keep';

export const changeCaseMap: Record<ChangeCase, (input: string) => string> = {
  camelCase: camelCase,
  capitalCase: capitalCase,
  constantCase: constantCase,
  dotCase: dotCase,
  headerCase: headerCase,
  noCase: noCase,
  paramCase: paramCase,
  pascalCase: pascalCase,
  pathCase: pathCase,
  sentenceCase: sentenceCase,
  snakeCase: snakeCase,
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

/**
 * the record key will be used as generated type name
 *
 * {
 *  [type name]: JsonType
 * }
 */
export type JsonTypeDefinitionMap = Record<string, JsonType>;

export type JsonTypeMap<JsonTypeDefinition> = ColumnBare & {
  name: keyof JsonTypeDefinition;
};

export type UserConfig<JsonTypeDefinitions = JsonTypeDefinitionMap> = {
  connectionURI?: ConnectionURI;
  dotEnvPath?: string;
  conventions?: Partial<Record<Exclude<ConfigKey, 'tables'> | 'paths', ChangeCase>>;
  schemas?: string[];
  targetSelectors?: (IncludeTargets | ExcludeTargets)[];
  typeMap?: {
    udt?: UdtTypeMap;
    json?: JsonTypeMap<JsonTypeDefinitions>[];
  };
  output?: {
    root?: string;
    includeSchemaPath?: boolean;
  };
};

export type TableAndColumn = {
  schema: string;
  tableName: string;
  columnName: string;
  dataType: KnownPgType | 'USER-DEFINED';
  userDefinedUdtSchema?: string | null;
  udtName: string;
  isNullable: boolean;
  tableComment?: string | null;
  columnComment?: string | null;
  defaults?: string | null;
};

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
  type: 'PrimaryKey' | 'ForeignKey' | 'Unique' | 'Check' | 'Exclude';
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
        json: JsonType;
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

export type Config = Required<Pick<UserConfig, 'connectionURI' | 'schemas'>> &
  DeepRequired<Pick<UserConfig, 'output'>> &
  Omit<UserConfig, 'dotEnvPath' | 'targetSelectors' | 'conventions'> & {
    renderTargets: RenderTargets;
    enumTypes: PgEnumTypes;
    compositeTypes: PgCompositeTypes;
  } & {
    conventions: Record<Exclude<ConfigKey, 'tables'> | 'paths', (input: string) => string>;
  };
