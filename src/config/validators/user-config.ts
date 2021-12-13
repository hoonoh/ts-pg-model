import dotenv from 'dotenv';
import { stat } from 'fs/promises';
import { clone } from 'lodash';
import { resolve } from 'path';
import { cwd } from 'process';
import { ConnectionError, createPool, DatabasePoolType, sql } from 'slonik';

import { Column } from '..';
import { getPgTypes } from '../pg-type';
import {
  Config,
  isConnectionURI,
  isIncludeTargets,
  RenderTargets,
  UserConfig,
} from '../types/config';
import { validateColumnNames } from './column';
import { validateSchema } from './schema';
import { validateTableNames } from './table';

const defaultConfig: Pick<Config, 'output'> = {
  output: {
    includeSchemaPath: false,
    root: resolve(cwd(), 'generated'),
  },
};

/**
 * Validates `UserConfig` and returns `Config`
 */
export const validateUserConfig = async ({
  connectionURI,
  dotEnvPath,
  namingConvention,
  schemas,
  targetSelectors,
  typeMap, // todo: handle user defined typeMap
  output,
  pool,
}: UserConfig & { pool?: DatabasePoolType } = {}) => {
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
    (await pool.one(sql<{ search_path: string }>`show search_path`)).search_path
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
  const tableAndColumns = await pool.many(sql<Column>`
    select
      table_schema "schema",
      table_name "tableName",
      column_name "columnName",
      c.data_type "dataType",
      case when udt_schema = 'pg_catalog' then null else udt_schema end "userDefinedUdtSchema",
      udt_name "udtName",
      is_nullable::bool "isNullable",
      pg_catalog.obj_description(oid, 'pg_class') "tableComment",
      column_default "default"
    from information_schema.columns c
    join pg_catalog.pg_class pc on pc.relname = c.table_name
    where true
    and table_schema not in ('pg_catalog', 'information_schema', 'pg_toast')
    group by table_schema, table_name, column_name, data_type, udt_schema, udt_name, is_nullable, pg_catalog.obj_description(oid, 'pg_class'), ordinal_position, column_default
    order by table_schema, table_name, ordinal_position;
  `);

  // list all available schemas
  const allSchemas = tableAndColumns.reduce((list, cur) => {
    if (!list.includes(cur.schema)) list.push(cur.schema);
    return list;
  }, [] as string[]);

  // validate schemas
  validateSchema({ names: schemas, allSchemas });

  // compose all render targets first
  const allRenderTargets = tableAndColumns.reduce((rtn, cur) => {
    const { schema, tableName, columnName } = cur;
    if (!rtn[schema]) rtn[schema] = {};
    if (!rtn[schema][tableName]) {
      rtn[schema][tableName] = {
        schema,
        tableName,
        columns: {},
      };
    }
    rtn[schema][tableName].columns[columnName] = cur;
    return rtn;
  }, {} as RenderTargets);

  const renderTargets: RenderTargets = {};

  // add each enabled schema's tables
  schemas.forEach(schema => {
    renderTargets[schema] = clone(allRenderTargets[schema]);
  });

  // run targetSelectors
  targetSelectors?.forEach(selector => {
    const isInclude = isIncludeTargets(selector);
    const targets = isInclude ? selector.include : selector.exclude;
    const tables = validateTableNames({ names: targets.tables, tableAndColumns });
    const columns = validateColumnNames({ names: targets.columns, tableAndColumns });

    // handle includes
    tables?.forEach(table => {
      // copy from allRenderTargets if undefined
      const { schema, tableName: name } = table;
      if (isInclude) {
        // handle table includes
        if (!renderTargets[schema]) renderTargets[schema] = {};
        if (!renderTargets[schema][name] && allRenderTargets[schema]?.[name]) {
          renderTargets[schema][name] = clone(allRenderTargets[schema][name]);
        }
      } else {
        // handle table excludes
        delete renderTargets[schema]?.[name];
      }
    });
    columns?.forEach(column => {
      const { schema, tableName: tableName, columnName: columnName } = column;
      const table = renderTargets[schema]?.[tableName];
      if (isInclude) {
        // handle column includes
        if (table && allRenderTargets[schema]?.[tableName]?.columns[columnName]) {
          table.columns[columnName] = clone(
            allRenderTargets[schema]?.[tableName]?.columns[columnName],
          );
        }
      } else {
        // handle column excludes
        delete renderTargets[schema]?.[tableName]?.columns[columnName];
      }
    });
  });

  const { enumTypes, compositeTypes } = await getPgTypes(pool);

  const rtn: Config = {
    connectionURI,
    namingConvention,
    schemas: Object.keys(renderTargets),
    renderTargets,
    enumTypes,
    compositeTypes,
    output: {
      root: output?.root || defaultConfig.output.root,
      includeSchemaPath: output?.includeSchemaPath || defaultConfig.output.includeSchemaPath,
    },
  };

  return rtn;
};
