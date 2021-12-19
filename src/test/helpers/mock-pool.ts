import { createMockPool, createMockQueryResult, QueryResultRowType, QueryResultType } from 'slonik';

import { Column, Table } from '../../config';
import { searchPathQuery, tableAndColumnsQuery } from '../../config/querries';

const defaultTableAndColumns: Column[] = [
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
  rows: QueryResultRowType[];
};

/**
 * by default mocks schemas `foo` & `bar` & tables `foo.bar` & `bar.baz`
 */
export const mockPool = (overrides?: Override[]) =>
  createMockPool({
    query: async (sql /*, values*/) => {
      // trim whitespace & linebreaks
      const trim = (query: string) =>
        query
          .split('\n')
          .map(line => line.trim())
          .join(' ')
          .trim();

      let overriden: QueryResultType<QueryResultRowType> | undefined;
      if (overrides) {
        overrides.forEach(({ sql: sqlOverride, rows }) => {
          if (sql === trim(sqlOverride)) {
            overriden = createMockQueryResult(rows);
          }
        });
      }
      if (overriden) return overriden;

      if (sql === trim(searchPathQuery.sql)) {
        return createMockQueryResult([{ search_path: 'foo,bar' }]);
      }
      if (sql === trim(tableAndColumnsQuery.sql)) {
        return createMockQueryResult(defaultTableAndColumns);
      }
      return createMockQueryResult([]);
    },
  });
