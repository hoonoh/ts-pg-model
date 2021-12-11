import dotenv from 'dotenv';
import { stat } from 'fs/promises';
import { ConnectionError, createPool, DatabasePoolType, sql } from 'slonik';

import { IncludeTargets, RenderTargets } from '..';
import {
  allTablesAndColumns,
  AllTablesAndColumnsRes,
  showSearchPath,
  ShowSearchPathRes,
} from '../querries';
import { Config, ConnectionURI, UserConfig } from '../types';
import { validateColumnNames } from './column';
import { validateSchema } from './schema';
import { validateTableNames } from './table';

const isConnectionURI = (str: string): str is ConnectionURI => {
  return str.startsWith('postgres://') || str.startsWith('postgresql://');
};

export const assertConfig = async ({
  connectionURI,
  dotEnvPath,
  namingConvention,
  schemas,
  targetSelectors,
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

  // generate pool if undefined
  pool ??= createPool(connectionURI);

  // test connection & get search paths
  const searchPaths: string[] = [];
  try {
    (await pool.one(sql<ShowSearchPathRes>`${showSearchPath}`)).search_path
      .split(',')
      .forEach(path => {
        const pathTrim = path.trim();
        if (pathTrim !== '"$user"') searchPaths.push(pathTrim);
      });
  } catch (error) {
    throw new Error((error as ConnectionError).message);
  }

  // in case schemas definition is undefined, use searchPaths as schema targets
  schemas ??= searchPaths;

  // list all table & columns
  const tableAndColumns = await pool.many(sql<AllTablesAndColumnsRes>`${allTablesAndColumns}`);

  // list all available schemas
  const allSchemas = tableAndColumns.reduce((list, cur) => {
    if (!list.includes(cur.schema)) list.push(cur.schema);
    return list;
  }, [] as string[]);

  // validate schemas
  validateSchema({ names: schemas, allSchemas });

  const isIncludeTargets = (target: any): target is IncludeTargets => {
    return Object.keys(target).includes('include');
  };

  // compose all render targets first
  const allRenderTargets = tableAndColumns.reduce((rtn, cur) => {
    const { schema, tableName, columnName } = cur;
    if (!rtn[schema]) rtn[schema] = {};
    if (!rtn[schema][tableName]) {
      rtn[schema][tableName] = {
        schema,
        name: tableName,
        columns: {},
      };
    }
    rtn[schema][tableName].columns[columnName] = cur;
    return rtn;
  }, {} as RenderTargets);

  const renderTargets: RenderTargets = {};

  // add schemas
  schemas.forEach(schema => {
    renderTargets[schema] = { ...allRenderTargets[schema] };
  });

  // run targetSelectors
  targetSelectors?.forEach(selector => {
    const isInclude = isIncludeTargets(selector);
    const targets = isInclude ? selector.include : selector.exclude;
    const tables = validateTableNames({ names: targets.tables, tableAndColumns });
    const columns = validateColumnNames({ names: targets.columns, tableAndColumns });

    if (isInclude) {
      tables?.forEach(table => {
        // copy from allRenderTargets if undefined
        const { schema, name } = table;
        if (!renderTargets[schema]) renderTargets[schema] = {};
        if (!renderTargets[schema][name] && allRenderTargets[schema]?.[name]) {
          renderTargets[schema][name] = allRenderTargets[schema][name];
        }
      });
      columns?.forEach(column => {
        const { schema, table: tableName, name: columnName } = column;
        const table = renderTargets[schema]?.[tableName];
        if (table && allRenderTargets[schema]?.[tableName]?.columns[columnName]) {
          table.columns[columnName] = allRenderTargets[schema]?.[tableName]?.columns[columnName];
        }
      });
    }

    // todo: handle excludes
  });

  const rtn: Config = {
    connectionURI,
    namingConvention,
    schemas,
    renderTargets,
  };

  return rtn;
};
