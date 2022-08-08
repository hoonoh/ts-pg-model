import assert from 'assert';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { lstat, readdir, stat } from 'fs/promises';
import { clone } from 'lodash-es';
import { resolve } from 'path';
import { cwd } from 'process';
import { readPackageUp } from 'read-pkg-up';
import { ConnectionError, createPool, DatabasePool } from 'slonik';
import stripJsonComments from 'strip-json-comments';

import { getPgTypes } from '../pg-type.js';
import {
  constraintsBareQuery,
  indexesBareQuery,
  searchPathQuery,
  tableAndColumnsQuery,
} from '../querries.js';
import {
  changeCaseMap,
  ColumnTypeMap,
  Config,
  isConnectionURI,
  isIncludeTargets,
  RenderTargets,
  UserConfig,
} from '../types/config.js';
import { isKnownPgType, knownPgTypeToTsTypesMap } from '../types/type-map.js';
import { validateColumnNames } from './column.js';
import { validateConstratints } from './constraint.js';
import { validateIndexes } from './pg-index.js';
import { validateSchema } from './schema.js';
import { validateTableNames } from './table.js';

const defaultConfig: Pick<Config, 'output' | 'tsConfig'> = {
  output: {
    includeSchemaPath: false,
    root: (() => {
      // try to resolve tsconfig.json sourceRoot
      let sourceRoot = '';
      try {
        sourceRoot =
          JSON.parse(
            stripJsonComments(readFileSync(resolve(cwd(), 'tsconfig.json'), { encoding: 'utf-8' })),
          )?.compilerOptions?.sourceRoot || 'src';
      } catch (error) {
        sourceRoot = 'src';
      }
      return resolve(cwd(), sourceRoot, 'generated');
    })(),
    existingFilePaths: [],
    keepFiles: [],
  },
  tsConfig: resolve(cwd(), 'tsconfig.json'),
};

/**
 * Validates `UserConfig` and returns `Config`
 */
export const validateUserConfig = async ({
  connectionURI,
  dotEnvPath,
  conventions,
  schemas,
  targetSelectors,
  typeMap,
  output,
  pool,
  ignoreCompositeTypeColumns,
  tsConfig,
}: UserConfig & { pool?: DatabasePool } = {}) => {
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

  tsConfig = tsConfig ? resolve(cwd(), tsConfig) : defaultConfig.tsConfig;
  try {
    await stat(tsConfig);
  } catch (error) {
    throw new Error(`tsConfig path "${tsConfig}" is invalid`);
  }

  // generate pool if undefined
  pool ??= await createPool(connectionURI);

  // test connection & get search paths
  const searchPaths: string[] = [];
  try {
    (await pool.one(searchPathQuery)).search_path.split(',').forEach(path => {
      const pathTrim = path.trim();
      if (pathTrim !== '"$user"') searchPaths.push(pathTrim);
    });
  } catch (error) {
    throw new Error((error as ConnectionError).message);
  }

  // in case schemas definition is undefined, use searchPaths as schema targets
  schemas ??= searchPaths;

  // list all table & columns
  const tableAndColumns = await pool.any(tableAndColumnsQuery);

  // list all available schemas
  const allSchemas = tableAndColumns.reduce((list, cur) => {
    if (!list.includes(cur.schema)) list.push(cur.schema);
    return list;
  }, [] as string[]);

  // validate schemas
  validateSchema({ names: schemas, allSchemas });

  // get pg types
  const { enumTypes, compositeTypes } = await getPgTypes(pool);

  // get and parse indexes
  const indexes = validateIndexes(await pool.any(indexesBareQuery));

  // get and parse constraints
  const constraints = validateConstratints(await pool.any(constraintsBareQuery));

  // compose all render targets first
  const allRenderTargets = tableAndColumns.reduce((rtn, cur) => {
    const { schema, tableName, columnName, tableComment } = cur;
    if (!rtn[schema]) rtn[schema] = {};
    if (!rtn[schema][tableName]) {
      rtn[schema][tableName] = {
        schema,
        tableName,
        comment: tableComment || undefined,
        columns: {},
      };
    }

    // indexes
    const matchingIndexes = indexes?.filter(i => i.schema === schema && i.tableName === tableName);
    if (matchingIndexes?.length) {
      rtn[schema][tableName].indexes = matchingIndexes;
    }

    // constraints
    const matchingConstraints = constraints?.filter(
      c => c.schema === schema && c.tableName === tableName,
    );
    if (matchingConstraints?.length) {
      rtn[schema][tableName].constraints = matchingConstraints;
    }

    // type mapping
    let type: ColumnTypeMap['type'] | undefined;
    const jsonTypeMap = typeMap?.json
      ?.filter(
        j =>
          j.schema === cur.schema &&
          j.tableName === cur.tableName &&
          j.columnName === cur.columnName,
      )
      .pop();
    if (
      // user defined type map
      typeMap?.udt &&
      Object.keys(typeMap.udt).includes(cur.udtName)
    ) {
      type = { ts: typeMap.udt[cur.udtName] };
    } else if (
      // user defined json type map
      jsonTypeMap
    ) {
      type = { json: jsonTypeMap };
    } else if (
      // user defined pg enum type
      cur.userDefinedUdtSchema &&
      enumTypes[cur.userDefinedUdtSchema] &&
      enumTypes[cur.userDefinedUdtSchema][cur.udtName]
    ) {
      type = { enum: enumTypes[cur.userDefinedUdtSchema][cur.udtName] };
    } else if (
      // user defined pg composite type
      cur.userDefinedUdtSchema &&
      compositeTypes[cur.userDefinedUdtSchema] &&
      compositeTypes[cur.userDefinedUdtSchema][cur.udtName]
    ) {
      type = { composite: compositeTypes[cur.userDefinedUdtSchema][cur.udtName] };
    } else if (
      // known pg types
      isKnownPgType(cur.udtName)
    ) {
      type = { ts: knownPgTypeToTsTypesMap[cur.udtName] };
    } else {
      // fallback as unknown
      type = { ts: 'unknown' };
    }

    assert(!!type, 'column type should always be defined');

    rtn[schema][tableName].columns[columnName] = {
      schema: cur.schema,
      tableName: cur.tableName,
      columnName: cur.columnName,
      dataType: cur.dataType,
      userDefinedUdtSchema: cur.userDefinedUdtSchema,
      udtName: cur.udtName,
      isNullable: cur.isNullable,
      comment: cur.columnComment || undefined,
      defaults: cur.defaults,
      type,
    };
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

  const outputRoot = output?.root || defaultConfig.output.root;

  const existingFilePaths = (() => {
    const rtn: string[] = [];

    const recurse = async (root: string) => {
      try {
        // skip if stat fails (noexist)
        await stat(root);
      } catch (error) {
        return;
      }
      await Promise.all(
        (
          await readdir(root)
        ).map(async p => {
          const pPath = resolve(root, p);
          const pStat = await lstat(pPath);
          if (pStat.isDirectory()) {
            await recurse(pPath);
          } else if (pStat.isFile()) {
            rtn.push(pPath);
          }
        }),
      );
    };
    recurse(outputRoot);

    return rtn.sort();
  })();

  // todo: enumTypes & compositeTypes should be filtered by table usage.
  // remove if unused so they dont get generated

  const rtn: Config = {
    connectionURI,
    conventions: {
      schemas: changeCaseMap[conventions?.schemas || 'camelCase'],
      columns: changeCaseMap[conventions?.columns || 'keep'],
      types: changeCaseMap[conventions?.types || 'camelCase'],
      paths: changeCaseMap[conventions?.paths || 'paramCase'],
    },
    schemas: Object.keys(renderTargets),
    renderTargets,
    enumTypes,
    compositeTypes,
    output: {
      root: outputRoot,
      includeSchemaPath: output?.includeSchemaPath || defaultConfig.output.includeSchemaPath,
      existingFilePaths,
      keepFiles:
        output?.keepFiles?.map(p => resolve(outputRoot, p)) || defaultConfig.output.keepFiles,
    },
    typeMap,
    ignoreCompositeTypeColumns: !!ignoreCompositeTypeColumns,
    importSuffix: (await readPackageUp())?.packageJson.type === 'module' ? '.js' : '',
    tsConfig,
  };

  return rtn;
};
