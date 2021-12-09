import { AllTablesAndColumnsRes } from '../querries';
import { ConfigKey, IncludeExcludeRule } from '../types';
import { validateColumnNames } from './column';
import { validateSchema } from './schema';
import { validateTableNames } from './table';

export const validateIncludeExcludePaths = ({
  allSchemas,
  tableAndColumns,
  input,
}: {
  allSchemas: string[];
  tableAndColumns: readonly AllTablesAndColumnsRes[];
  input?: Partial<Record<ConfigKey, string[]>>;
}) => {
  //

  if (!input) return undefined;

  const rtn: IncludeExcludeRule = {};

  Object.entries(input).forEach(([k, names]) => {
    const key = k as ConfigKey;
    if (key === 'schema') {
      rtn.schema = validateSchema({ names, allSchemas });
    } else if (key === 'table') {
      rtn.table = validateTableNames({ names, tableAndColumns });
    } else if (key === 'column') {
      rtn.column = validateColumnNames({ names, tableAndColumns });
    }
  });

  return rtn;
};
