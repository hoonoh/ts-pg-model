import { merge } from 'lodash';
import { DatabasePoolType } from 'slonik';

import { compositeTypesBareQuery, enumTypesBareQuery } from './querries';
import { PgCompositeTypeBare, PgCompositeTypes, PgEnumTypes } from './types/pg';
import { isKnownPgType, knownPgTypeToTsTypesMap } from './types/type-map';

export const getPgTypes = async (pool: DatabasePoolType) => {
  const enumTypesBare = await pool.any(enumTypesBareQuery);

  const enumTypes = enumTypesBare.reduce((rtn, cur) => {
    const { schema, name, label } = cur;
    if (!rtn[schema]) rtn[schema] = {};
    if (!rtn[schema][name]) rtn[schema][name] = { schema, name, labels: [], sortOrder: 0 };
    rtn[schema][name].labels.push(label);
    return rtn;
  }, {} as PgEnumTypes);

  const compositeTypesBare = await pool.any(compositeTypesBareQuery);

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
