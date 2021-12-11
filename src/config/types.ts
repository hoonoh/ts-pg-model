import { AllTablesAndColumnsRes } from './querries';

export type ConfigKey = 'schemas' | 'tables' | 'columns';

export type ConnectionURI = `${'postgres' | 'postgresql'}://${string}`;

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
  | 'snakeCase';

type NonEmptyArray<T> = [T, ...T[]];

export type TargetSelector =
  | (Partial<Record<Extract<ConfigKey, 'columns'>, NonEmptyArray<string>>> &
      Record<Extract<ConfigKey, 'tables'>, NonEmptyArray<string>>)
  | (Partial<Record<Extract<ConfigKey, 'tables'>, NonEmptyArray<string>>> &
      Record<Extract<ConfigKey, 'columns'>, NonEmptyArray<string>>);

export type IncludeTargets = { include: TargetSelector };
export type ExcludeTargets = { exclude: TargetSelector };

export type UserConfig = {
  connectionURI?: ConnectionURI;
  dotEnvPath?: string;
  namingConvention?: Partial<Record<ConfigKey, ChangeCase>>;
  schemas?: string[];
  targetSelectors?: (IncludeTargets | ExcludeTargets)[];
};

export type Table = {
  schema: string;
  name: string;
};

export type Column = {
  schema: string;
  table: string;
  name: string;
};

export type TableColumns = Table & {
  columns: Map<string, Column>;
};

// nested map: schemas -> tables -> columns
// export type RenderTargets = Map<string, Map<string, TableColumns>>;
export type RenderTargets = Record<
  string,
  Record<string, Table & { columns: Record<string, AllTablesAndColumnsRes> }>
>;

export type Config = Required<Pick<UserConfig, 'connectionURI' | 'schemas'>> &
  Omit<UserConfig, 'dotEnvPath' | 'targetSelectors'> & { renderTargets: RenderTargets };
