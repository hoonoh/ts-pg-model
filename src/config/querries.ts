import { sql } from 'slonik';

import { Column } from './types/config';
import { PgCompositeTypeBare, PgEnumTypeBare } from './types/pg';

export const searchPathQuery = sql<{ search_path: string }>`show search_path`;

export const tableAndColumnsQuery = sql<Column>`
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
  where table_schema not in ('pg_catalog', 'information_schema', 'pg_toast')
  group by table_schema, table_name, column_name, data_type, udt_schema, udt_name, is_nullable, pg_catalog.obj_description(oid, 'pg_class'), ordinal_position, column_default
  order by table_schema, table_name, ordinal_position;
`;

export const enumTypesBareQuery = sql<PgEnumTypeBare>`
  select
    n.nspname "schema",
    t.typname "name",
    e.enumlabel "label",
    enumsortorder "sortOrder"
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_catalog.pg_namespace n on n.oid = t.typnamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
  order by "schema", "name", enumsortorder
`;

export const compositeTypesBareQuery = sql<PgCompositeTypeBare>`
  with types as (
    select
      n.nspname,
      pg_catalog.format_type (t.oid, null) obj_name
    from pg_catalog.pg_type t
    join pg_catalog.pg_namespace n on n.oid = t.typnamespace
    where true
    and (
      t.typrelid = 0
      or (select c.relkind = 'c' from pg_catalog.pg_class c where c.oid = t.typrelid)
    )
    and not exists (
      select 1
      from pg_catalog.pg_type el
      where el.oid = t.typelem
      and el.typarray = t.oid
    )
    and n.nspname not in ('pg_catalog', 'information_schema')
    and n.nspname !~ '^pg_toast'
  )
  select
    n.nspname::text "schema",
    t.typname "name",
    a.attname::text "attributeName",
    pg_catalog.format_type (a.atttypid, a.atttypmod) "type",
    a.attnum "sortOrder"
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_type t on a.attrelid = t.typrelid
  join pg_catalog.pg_namespace n on n.oid = t.typnamespace
  join types on (types.nspname = n.nspname and types.obj_name = pg_catalog.format_type (t.oid, null))
  where a.attnum > 0
  and not a.attisdropped
  order by "schema", "name", attnum
`;
