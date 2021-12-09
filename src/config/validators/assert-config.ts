import dotenv from 'dotenv';
import { stat } from 'fs/promises';
import { ConnectionError, createPool, DatabasePoolType, sql } from 'slonik';
import { raw } from 'slonik-sql-tag-raw';

import {
  allTablesAndColumns,
  AllTablesAndColumnsRes,
  showSearchPath,
  ShowSearchPathRes,
} from '../querries';
import { Config, ConnectionURI, UserConfig } from '../types';
import { validateIncludeExcludePaths } from './include-exclude-paths';

const isConnectionURI = (str: string): str is ConnectionURI => {
  return str.startsWith('postgres://') || str.startsWith('postgresql://');
};

export const assertConfig = async ({
  connectionURI,
  dotEnvPath,
  namingConvention,
  include,
  exclude,
  pool,
}: UserConfig & { pool?: DatabasePoolType }) => {
  if (!connectionURI) {
    if (dotEnvPath) {
      try {
        await stat(dotEnvPath);
      } catch (error) {
        throw new Error(`dotEnvPath ${dotEnvPath} file path not found`);
      }
    }
    dotenv.config({ path: dotEnvPath });
    const envConnURI = process.env.PG_CONNECTION_URI;
    if (envConnURI) {
      if (isConnectionURI(envConnURI)) {
        connectionURI = envConnURI;
      } else {
        throw new Error(`PG_CONNECTION_URI value "${envConnURI}" is invalid`);
      }
    }
    if (!connectionURI) throw new Error('valid connectionURI cannot be found');
  } else if (!isConnectionURI(connectionURI)) {
    throw new Error(`connectionURI value "${connectionURI}" is invalid`);
  }

  const rtn: Config = {
    connectionURI,
    namingConvention,
  };

  // generate pool if undefined
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
  const allSchemas = tableAndColumns.reduce((list, cur) => {
    if (!list.includes(cur.schema)) list.push(cur.schema);
    return list;
  }, [] as string[]);

  // validate include & exclude paths
  rtn.include = validateIncludeExcludePaths({ allSchemas, tableAndColumns, input: include });
  rtn.exclude = validateIncludeExcludePaths({ allSchemas, tableAndColumns, input: exclude });

  // todo: resolve result table / columns to render as TS model

  return rtn;
};
