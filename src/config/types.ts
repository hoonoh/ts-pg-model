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
  tableName: string;
  columns: Record<string, Column>;
};

export type TableBare = Omit<Table, 'columns'>;

export type Column = {
  schema: string;
  tableName: string;
  columnName: string;
  dataType: string;
  userDefinedUdtSchema?: string | null;
  udtName: string;
  isNullable: boolean;
  tableComment?: string | null;
  default?: string | null;
};

export type ColumnBare = Pick<Column, 'schema' | 'tableName' | 'columnName'>;

export type RenderTargets = Record<string, Record<string, Table>>;

export type Config = Required<Pick<UserConfig, 'connectionURI' | 'schemas'>> &
  Omit<UserConfig, 'dotEnvPath' | 'targetSelectors'> & { renderTargets: RenderTargets };
