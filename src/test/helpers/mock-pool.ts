import {
  createDriverFactory,
  DriverQueryResult,
  DriverStream,
  DriverStreamResult,
} from '@slonik/driver';
import EventEmitter from 'events';
import { createPool, Field, QueryResultRow } from 'slonik';
import { ConnectionPoolClient } from 'slonik/dist/factories/createConnectionPool.js';

import { searchPathQuery, tableAndColumnsQuery } from '../../config/querries.js';
import { Table, TableAndColumn } from '../../config/types/config.js';
import { connectionURI } from '../constants.js';

const defaultTableAndColumns: TableAndColumn[] = [
  {
    schema: 'foo',
    tableName: 'bar',
    columnName: 'id',
    dataType: 'integer',
    isNullable: false,
    udtName: 'int4',
  },
  {
    schema: 'bar',
    tableName: 'baz',
    columnName: 'id',
    dataType: 'integer',
    isNullable: false,
    udtName: 'int4',
  },
];

export const defaultMockPool = {
  schemas: defaultTableAndColumns.reduce((rtn, cur) => {
    if (!rtn.includes(cur.schema)) rtn.push(cur.schema);
    return rtn;
  }, [] as string[]),
  tables: defaultTableAndColumns.reduce((rtn, cur) => {
    let table = rtn.find(r => r.schema === cur.schema && r.tableName === cur.tableName);
    if (!table) {
      table = { schema: cur.schema, tableName: cur.tableName, columns: {} };
      rtn.push(table);
    }
    table.columns[cur.columnName] = cur;
    return rtn;
  }, [] as Table[]),
};

// https://github.com/gajus/slonik/blob/b9efe3b04f38911db3736b89cdc50aee04ada11a/src/factories/createMockQueryResult.ts
export const createMockQueryResult = (rows: QueryResultRow[]): DriverQueryResult => {
  let fields: Field[] = [];
  if (rows.length > 0) {
    fields = Object.keys(rows[0]).map(it => ({ dataTypeId: 0, name: it }));
  }

  return {
    command: 'SELECT',
    fields,
    rowCount: rows.length,
    rows,
  } satisfies DriverQueryResult;
};

type Override = {
  sql: string;
  rows: QueryResultRow[];
};

/**
 * by default mocks schemas `foo` & `bar` & tables `foo.bar` & `bar.baz`
 * ref: https://github.com/gajus/slonik/blob/e93befde71eb5acca6e773f7a5b7ea7e459b8b5d/packages/slonik/src/helpers.test/createPoolWithSpy.ts#L7
 */
export const mockPool = (
  overrides?: Override[],
  tableAndColumns: TableAndColumn[] = defaultTableAndColumns,
) => {
  let connection: ConnectionPoolClient;

  return createPool(connectionURI, {
    driverFactory: async (...args) => {
      const factory = createDriverFactory(async ({}) => {
        return {
          createPoolClient: async ({}) => {
            return {
              // connect, end & stream methods are dummies
              connect: async () => {},
              end: async () => {},
              stream: () => ({}) as DriverStream<DriverStreamResult>,
              query: async sql => {
                // slonik internal function `validateConnection()` will query `SELECT 1` to validate connections.
                // https://github.com/gajus/slonik/blob/12dd253db08d8d6b94f184f6840f72111829ca15/packages/slonik/src/factories/createConnectionPool.ts#L114-L131
                // https://github.com/gajus/slonik/releases/tag/slonik%4048.4.0
                if (sql === 'SELECT 1') return createMockQueryResult([{ '1': 1 }]);

                const normalize = (q: string) =>
                  q
                    .split('\n')
                    .map(line => line.trim())
                    .join('\n')
                    .trim();

                let overriden: DriverQueryResult | undefined;
                if (overrides) {
                  overrides.forEach(({ sql: sqlOverride, rows }) => {
                    if (normalize(sql) === normalize(sqlOverride)) {
                      overriden = createMockQueryResult(rows);
                    }
                  });
                }
                if (overriden) return overriden;

                if (normalize(sql) === normalize(searchPathQuery.sql)) {
                  const searchPaths = tableAndColumns.reduce((acc, cur) => {
                    if (!acc.includes(cur.schema)) acc.push(cur.schema);
                    return acc;
                  }, [] as string[]);
                  return createMockQueryResult([{ search_path: searchPaths.join(',') }]);
                }
                if (normalize(sql) === normalize(tableAndColumnsQuery.sql)) {
                  return createMockQueryResult(tableAndColumns);
                }
                return createMockQueryResult([]);
              },
            };
          },
        };
      });
      const driver = await factory(...args);

      return {
        createClient: async () => {
          if (connection) return connection;

          connection = await driver.createClient().then(nextConnection => {
            return {
              ...nextConnection,
              events: new EventEmitter(),
            };
          });

          return connection;
        },
      };
    },
  });
};
