import { Column, ColumnBare } from '../types/config';
import { throwInvalid } from './error';

export const validateColumnNames = ({
  names,
  tableAndColumns,
}: {
  names?: string[];
  tableAndColumns: readonly Column[];
}) => {
  //
  const rtn: ColumnBare[] = [];

  names?.forEach(name => {
    const splitName = name.split('.');
    if (splitName.length >= 4) throwInvalid('columns', name);

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

    const rtnSub: ColumnBare[] = [];
    tableAndColumns.forEach(cur => {
      if (
        (!schema || cur.schema === schema) &&
        (!tableName || cur.tableName === tableName) &&
        cur.columnName === columnName &&
        !rtn.find(
          l =>
            l.schema === cur.schema &&
            l.tableName === cur.tableName &&
            l.columnName === cur.columnName,
        ) &&
        !rtnSub.find(
          l =>
            l.schema === cur.schema &&
            l.tableName === cur.tableName &&
            l.columnName === cur.columnName,
        )
      ) {
        rtnSub.push({ schema: cur.schema, tableName: cur.tableName, columnName: cur.columnName });
      }
    });

    if (!rtnSub.length) throwInvalid('columns', name);
    rtn.push(...rtnSub);
  });

  return rtn.length ? rtn : undefined;
};
