import { TableAndColumn, TableBare } from '../types/config.js';
import { throwInvalid } from './error.js';

export const validateTableNames = ({
  names,
  tableAndColumns,
}: {
  names?: string[];
  tableAndColumns: readonly TableAndColumn[];
}) => {
  //
  const rtn: TableBare[] = [];

  names?.forEach(name => {
    const splitName = name.split('.');
    if (splitName.length >= 3) throwInvalid('tables', name);

    let schema: string | undefined;
    let tableName: string | undefined;

    if (splitName.length === 2) {
      [schema, tableName] = splitName;
    } else {
      [tableName] = splitName;
    }

    const rtnSub: TableBare[] = [];
    tableAndColumns.forEach(cur => {
      if (
        (!schema || cur.schema === schema) &&
        cur.tableName === tableName &&
        !rtn.find(l => l.schema === cur.schema && l.tableName === cur.tableName) &&
        !rtnSub.find(l => l.schema === cur.schema && l.tableName === cur.tableName)
      ) {
        rtnSub.push({
          schema: cur.schema,
          tableName: cur.tableName,
          comment: !!cur.tableComment ? cur.tableComment : undefined,
        });
      }
    });

    if (!rtnSub.length) throwInvalid('tables', name);
    rtn.push(...rtnSub);
  });

  return rtn.length ? rtn : undefined;
};
