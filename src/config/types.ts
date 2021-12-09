export type ConfigKey = 'schema' | 'table' | 'column';

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

export type UserConfig = {
  connectionURI?: ConnectionURI;
  dotEnvPath?: string;
  namingConvention?: Partial<Record<ConfigKey, ChangeCase>>;
  include?: Partial<Record<ConfigKey, string[]>>;
  exclude?: Partial<Record<ConfigKey, string[]>>;
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

export type IncludeExcludeRule = {
  schema?: string[];
  table?: Table[];
  column?: Column[];
};

export type Config = {
  connectionURI: ConnectionURI;
  namingConvention?: Partial<Record<ConfigKey, ChangeCase>>;
  include?: IncludeExcludeRule;
  exclude?: IncludeExcludeRule;
};
