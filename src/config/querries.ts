import { sql } from 'slonik';
import z from 'zod';

import { tableAndColumnZod } from './types/config.js';
import {
  pgCompositeTypeBareZod,
  pgConstraintsBareZod,
  pgEnumTypeBareZod,
  pgIndexBareZod,
} from './types/pg.js';

export const searchPathQuery = sql.type(z.object({ search_path: z.string() }))`
  /* searchPathQuery */
  show search_path
`;

// slonik-live-server-disable-cost-errors
export const tableAndColumnsQuery = sql.type(tableAndColumnZod)`
  /* tableAndColumnsQuery */
  select
    table_schema "schema",
    table_name "tableName",
    column_name "columnName",
    c.data_type "dataType",
    case when udt_schema = 'pg_catalog' then null else udt_schema end "userDefinedUdtSchema",
    udt_name "udtName",
    is_nullable::bool "isNullable",
    obj_description(oid, 'pg_class') "tableComment",
    col_description(oid, ordinal_position) "columnComment",
    column_default "default"
  from information_schema.columns c
  join pg_class pc on pc.relname = c.table_name
  where table_schema not in ('pg_catalog', 'information_schema', 'pg_toast')
  group by table_schema, table_name, column_name, data_type, udt_schema, udt_name, is_nullable,
    obj_description(oid, 'pg_class'), col_description(oid, ordinal_position),
    ordinal_position, column_default
  order by table_schema, table_name, ordinal_position;
`;

export const enumTypesBareQuery = sql.type(pgEnumTypeBareZod)`
  /* enumTypesBareQuery */
  select
    n.nspname "schema",
    t.typname "name",
    e.enumlabel "label",
    enumsortorder "sortOrder"
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
  order by "schema", "name", enumsortorder
`;

// slonik-live-server-disable-cost-errors
export const compositeTypesBareQuery = sql.type(pgCompositeTypeBareZod)`
  /* compositeTypesBareQuery */
  with types as (
    select
      n.nspname,
      format_type (t.oid, null) obj_name
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where true
    and (
      t.typrelid = 0
      or (select c.relkind = 'c' from pg_class c where c.oid = t.typrelid)
    )
    and not exists (
      select 1
      from pg_type el
      where el.oid = t.typelem
      and el.typarray = t.oid
    )
    and n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
  ),
  list as (
    select
      a.atttypid,
      t.oid,
      n.nspname::text "schema",
      t.typname "name",
      a.attname::text "attributeName",
      format_type (a.atttypid, a.atttypmod) "type",
      a.attnum "sortOrder",
      case
        when (select oid from pg_enum e where e.enumtypid = a.atttypid limit 1) is not null then true
        else false
      end "isEnum"
    from pg_attribute a
    join pg_type t on a.attrelid = t.typrelid
    join pg_namespace n on n.oid = t.typnamespace
    join types on (types.nspname = n.nspname and types.obj_name = format_type (t.oid, null))
    where a.attnum > 0
    and not a.attisdropped
    order by "schema", "name", attnum
  )
  select
    "schema",
    "name",
    "attributeName",
    "sortOrder",
    "type",
    case
      when "isEnum" = true then 'enum'
      when (select oid from list sl where l.atttypid = sl.oid limit 1) is not null then 'composite'
      else null
    end "userType"
  from list l
`;

export const indexesBareQuery = sql.type(pgIndexBareZod)`
  /* indexesBareQuery */
  select
    schemaname as schema,
    tablename "tableName",
    indexname "indexName",
    indexdef "definition"
  from
  pg_indexes
  where schemaname not in ('pg_catalog', 'information_schema', 'pg_toast')
  order by schemaname, tablename, indexname
`;

export const constraintsBareQuery = sql.type(pgConstraintsBareZod)`
  /* constraintsBareQuery */
  select
    n.nspname as schema,
    pc.relname "tableName",
    c.conname "constraintName",
    c.contype "type",
    pg_get_constraintdef(c.oid) "definition"
  from pg_constraint c
  join pg_namespace n on n.oid = c.connamespace
  join pg_class pc on c.conrelid != 0 and c.conrelid = pc.oid
  where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
  order by n.nspname, pc.relname, c.contype, conname;
`;
