import dotenv from 'dotenv';
import { stat } from 'fs/promises';
import { ConnectionError, createPool, DatabasePoolType, sql } from 'slonik';
import { raw } from 'slonik-sql-tag-raw';

import {
  allTablesAndColumns,
  AllTablesAndColumnsRes,
  showSearchPath,
  ShowSearchPathRes,
} from './querries';

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

type ConfigKey = 'schema' | 'table' | 'column';

type ConnectionURI = `${'postgres' | 'postgresql'}://${string}`;

const isConnectionURI = (str: string): str is ConnectionURI => {
  return str.startsWith('postgres://') || str.startsWith('postgresql://');
};

export type Config = {
  connectionURI?: ConnectionURI;
  dotEnvPath?: string;
  namingConvention?: Partial<Record<ConfigKey, ChangeCase>>;
  include?: Partial<Record<ConfigKey, string[]>>;
  exclude?: Partial<Record<ConfigKey, string[]>>;
};

export const assertConfig = async (
  config?: Config & { pool?: DatabasePoolType },
): Promise<Omit<Config, 'dotEnvPath'>> => {
  if (!config) return {};
  let { connectionURI, include, exclude } = config;
  if (!connectionURI) {
    if (config.dotEnvPath) {
      try {
        await stat(config.dotEnvPath);
      } catch (error) {
        throw new Error(`dotEnvPath ${config.dotEnvPath} file path not found`);
      }
    }
    dotenv.config({ path: config.dotEnvPath });
    const envConnURI = process.env.PG_CONNECTION_URI;
    if (envConnURI) {
      if (isConnectionURI(envConnURI)) {
        connectionURI = envConnURI;
      } else {
        throw new Error(`PG_CONNECTION_URI value ${envConnURI} is invalid`);
      }
    }
    if (!connectionURI) throw new Error('valid connectionURI cannot be found');
  }

  // generate pool if undefined
  let { pool } = config;
  pool ??= createPool(connectionURI);

  // test connection & get search paths
  const searchPaths: string[] = [];
  try {
    (await pool.one(sql<ShowSearchPathRes>`${raw(showSearchPath)}`)).search_path
      .split(',')
      .forEach(path => {
        const pathTrim = path.trim();
        if (pathTrim !== '"$user"') searchPaths.push(pathTrim);
      });
  } catch (error) {
    throw new Error((error as ConnectionError).message);
  }

  // list all table & columns
  const tableAndColumns = await pool.many(sql<AllTablesAndColumnsRes>`${raw(allTablesAndColumns)}`);

  // list all available schemas
  const allSchemas = tableAndColumns.reduce((rtn, cur) => {
    if (!rtn.includes(cur.schema)) rtn.push(cur.schema);
    return rtn;
  }, [] as string[]);

  // validate include & exclude paths
  const validateIncludeExcludePaths = async (input?: Partial<Record<ConfigKey, string[]>>) => {
    if (!input) return undefined;

    const throwInvalid = (key: ConfigKey, name: string) => {
      throw new Error(`invalid ${key} name: "${name}"`);
    };

    const res = Object.entries(input).map(([k, names]) => {
      const key = k as ConfigKey;
      if (key === 'schema') {
        names.forEach(name => {
          if (!allSchemas.includes(name)) throwInvalid(key, name);
        });
      } else if (key === 'table') {
        names.forEach(name => {
          const splitName = name.split('.');
          if (splitName.length >= 3) throwInvalid(key, name);

          let schema: string | undefined;
          let tableName: string | undefined;

          if (splitName.length === 2) {
            [schema, tableName] = splitName;
          } else {
            [tableName] = splitName;
          }

          if (
            !tableAndColumns.find(
              cur => (!schema || cur.schema === schema) && cur.tableName === tableName,
            )
          ) {
            throwInvalid(key, name);
          }
        });
      } else if (key === 'column') {
        names.forEach(name => {
          const splitName = name.split('.');
          if (splitName.length >= 4) throwInvalid(key, name);

          let schema: string | undefined;
          let tableName: string | undefined;
          let columnName: string | undefined;

          if (splitName.length === 3) {
            [schema, tableName, columnName] = splitName;
          } else if (splitName.length === 2) {
            [tableName, columnName] = splitName;
          } else {
            [columnName] = splitName;
          }

          if (
            !tableAndColumns.find(
              cur =>
                (!schema || cur.schema === schema) &&
                (!tableName || cur.tableName === tableName) &&
                cur.columnName === columnName,
            )
          ) {
            throwInvalid(key, name);
          }

          // todo: return all valid table and column names
        });
      }
      return [k, names];
    });
    return Object.fromEntries(res);
  };
  include = await validateIncludeExcludePaths(include);
  exclude = await validateIncludeExcludePaths(exclude);

  return {
    connectionURI,
    include,
    exclude,
    ...config,
  };
};
