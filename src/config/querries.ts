export const showSearchPath = 'show search_path';
export type ShowSearchPathRes = {
  search_path: string;
};

export const allTablesAndColumns = `
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
order by table_schema, table_name, ordinal_position;`;
export type AllTablesAndColumnsRes = {
  schema: string;
  tableName: string;
  columnName: string;
  dataType: string;
  userDefinedUdtSchema?: string | null;
  udtName: string;
  isNullable: boolean;
  tableComment?: string | null;
  default?: string | null;
};
