import { createMockPool, createMockQueryResult, QueryResult, QueryResultRow } from 'slonik';

import { searchPathQuery, tableAndColumnsQuery } from '../../config/querries.js';
import { Table, TableAndColumn } from '../../config/types/config.js';

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

type Override = {
  sql: string;
  rows: QueryResultRow[];
};

/**
 * by default mocks schemas `foo` & `bar` & tables `foo.bar` & `bar.baz`
 */
export const mockPool = (
  overrides?: Override[],
  tableAndColumns: TableAndColumn[] = defaultTableAndColumns,
) =>
  createMockPool({
    query: async (sql /*, values*/) => {
      // trim line whitespaces
      const normalize = (query: string) =>
        query
          .split('\n')
          .map(line => line.trim())
          .join('\n')
          .trim();

      let overriden: QueryResult<QueryResultRow> | undefined;
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
  });
