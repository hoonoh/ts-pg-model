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

export type Config = {
  connectionURI?: ConnectionURI;
  dotEnvPath?: string;
  namingConvention?: Partial<Record<ConfigKey, ChangeCase>>;
  include?: Partial<Record<ConfigKey, string[]>>;
  exclude?: Partial<Record<ConfigKey, string[]>>;
};
