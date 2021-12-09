import { Column } from '..';
import { AllTablesAndColumnsRes } from '../querries';
import { throwInvalid } from './error';

export const validateColumnNames = ({
  names,
  tableAndColumns,
}: {
  names: string[];
  tableAndColumns: readonly AllTablesAndColumnsRes[];
}) => {
  //
  const rtn: Column[] = [];

  names.forEach(name => {
    const splitName = name.split('.');
    if (splitName.length >= 4) throwInvalid('column', name);

    let schema: string | undefined;
    let tableName: string | undefined;
    let columnName: string | undefined;

    if (splitName.length === 3) {
      [schema, tableName, columnName] = splitName;
    } else if (splitName.length === 2) {
      [tableName, columnName] = splitName;
    } else {
      [columnName] = splitName;
    }

    const rtnSub: Column[] = [];
    tableAndColumns.forEach(cur => {
      if (
        (!schema || cur.schema === schema) &&
        (!tableName || cur.tableName === tableName) &&
        cur.columnName === columnName &&
        !rtn.find(l => l.schema === cur.schema && l.table === tableName && l.name === columnName) &&
        !rtnSub.find(l => l.schema === cur.schema && l.table === tableName && l.name === columnName)
      ) {
        rtnSub.push({ schema: cur.schema, table: cur.tableName, name: cur.columnName });
      }
    });

    if (!rtnSub.length) throwInvalid('column', name);
    rtn.push(...rtnSub);
  });

  return rtn.length ? rtn : undefined;
};
