import { merge } from 'lodash';
import { DatabasePoolType, sql } from 'slonik';

import { PgCompositeTypeBare, PgCompositeTypes, PgEnumTypeBare, PgEnumTypes } from './types/pg';
import { isKnownPgType, knownPgTypeToTsTypesMap } from './types/type-map';

export const getPgTypes = async (pool: DatabasePoolType) => {
  const enumTypesBare = await pool.any<PgEnumTypeBare>(sql`
    select
    n.nspname "schema",
    t.typname "name",
    e.enumlabel "label",
    enumsortorder "sortOrder"
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_catalog.pg_namespace n on n.oid = t.typnamespace
    where true
    and n.nspname not in ('pg_catalog', 'information_schema')
    order by "schema", "name", enumsortorder
  `);

  const enumTypes = enumTypesBare.reduce((rtn, cur) => {
    const { schema, name, label } = cur;
    if (!rtn[schema]) rtn[schema] = {};
    if (!rtn[schema][name]) rtn[schema][name] = { schema, name, labels: [], sortOrder: 0 };
    rtn[schema][name].labels.push(label);
    return rtn;
  }, {} as PgEnumTypes);

  const compositeTypesBare = await pool.any<PgCompositeTypeBare>(sql`
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
    where true
    and a.attnum > 0
    and not a.attisdropped
    order by "schema", "name", attnum
  `);

  const compositeTypesRetry: PgCompositeTypeBare[] = [];

  const compositeTypeReducer = (
    from: PgCompositeTypeBare[],
    findCompositeTypesFrom?: PgCompositeTypes,
  ) =>
    from.reduce((rtn, cur) => {
      const { schema, name, attributeName, type } = cur;
      if (!rtn[schema]) rtn[schema] = {};
      if (!rtn[schema][name]) rtn[schema][name] = { schema, name, attributes: {} };

      if (isKnownPgType(type)) {
        rtn[schema][name].attributes[attributeName] = knownPgTypeToTsTypesMap[type];
      } else if (type.match(/\w+\.\w+/)) {
        // type = `[string].[string]`, check if enum or composite type

        const [typeSchema, typeName] = type.split('.');
        if (!typeSchema || !typeName) throw new Error(`unexpected composite type name "${type}"`);
        if (enumTypes[typeSchema][typeName]) {
          // enum type
          rtn[schema][name].attributes[attributeName] = enumTypes[typeSchema][typeName];
        } else if (findCompositeTypesFrom?.[typeSchema][typeName]) {
          // composite type found from retry routine
          rtn[schema][name].attributes[attributeName] =
            findCompositeTypesFrom[typeSchema][typeName];
        } else if (rtn[typeSchema][typeName]) {
          // composite type found from parsed list
          rtn[schema][name].attributes[attributeName] = rtn[typeSchema][typeName];
        } else if (!findCompositeTypesFrom) {
          // target composite type may not be parsed yet, register for retry
          compositeTypesRetry.push(cur);
        } else {
          // unexpected error
          throw new Error(`unexpected type ${type}`);
        }
      }
      return rtn;
    }, {} as PgCompositeTypes);

  let compositeTypes = compositeTypeReducer(compositeTypesBare.concat());
  const retry = compositeTypeReducer(compositeTypesRetry, compositeTypes);
  compositeTypes = merge(compositeTypes, retry);

  return {
    enumTypes,
    compositeTypes,
  };
};
