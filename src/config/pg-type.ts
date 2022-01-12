import { merge } from 'lodash-es';
import { DatabasePool } from 'slonik';

import { compositeTypesBareQuery, enumTypesBareQuery } from './querries.js';
import { PgCompositeTypeBare, PgCompositeTypes, PgEnumTypes } from './types/pg.js';
import { isKnownPgType, knownPgTypeToTsTypesMap } from './types/type-map.js';

export const getPgTypes = async (pool: DatabasePool) => {
  const enumTypesBare = await pool.any(enumTypesBareQuery);

  const enumTypes = enumTypesBare.reduce((rtn, cur) => {
    const { schema, name, label } = cur;
    if (!rtn[schema]) rtn[schema] = {};
    if (!rtn[schema][name]) rtn[schema][name] = { schema, name, labels: [] };
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
      const { schema, name, attributeName, type, userType } = cur;
      if (!rtn[schema]) rtn[schema] = {};
      if (!rtn[schema][name]) rtn[schema][name] = { schema, name, attributes: {} };

      if (isKnownPgType(type)) {
        rtn[schema][name].attributes[attributeName] = knownPgTypeToTsTypesMap[type];
      } else if (userType) {
        const [typeSchema, typeName] = type.split('.');
        if (
          // enum type
          userType === 'enum'
        ) {
          rtn[schema][name].attributes[attributeName] = enumTypes[typeSchema][typeName];
        } else if (
          // composite type
          userType === 'composite'
        ) {
          if (
            // composite type found from retry routine
            findCompositeTypesFrom?.[typeSchema][typeName]
          ) {
            rtn[schema][name].attributes[attributeName] =
              findCompositeTypesFrom[typeSchema][typeName];
          } else if (
            // composite type found from parsed list
            rtn[typeSchema][typeName]
          ) {
            rtn[schema][name].attributes[attributeName] = rtn[typeSchema][typeName];
          } else if (
            // target composite type may not be parsed yet, register for retry
            !findCompositeTypesFrom
          ) {
            compositeTypesRetry.push(cur);
          } else {
            // unexpected error
            throw new Error(`unexpected type ${type}`);
          }
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
