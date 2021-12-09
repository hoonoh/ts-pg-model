import { Table } from '..';
import { AllTablesAndColumnsRes } from '../querries';
import { throwInvalid } from './error';

export const validateTableNames = ({
  names,
  tableAndColumns,
}: {
  names: string[];
  tableAndColumns: readonly AllTablesAndColumnsRes[];
}) => {
  //
  const rtn: Table[] = [];

  names.forEach(name => {
    const splitName = name.split('.');
    if (splitName.length >= 3) throwInvalid('table', name);

    let schema: string | undefined;
    let tableName: string | undefined;

    if (splitName.length === 2) {
      [schema, tableName] = splitName;
    } else {
      [tableName] = splitName;
    }

    const rtnSub: Table[] = [];
    tableAndColumns.forEach(cur => {
      if (
        (!schema || cur.schema === schema) &&
        cur.tableName === tableName &&
        !rtn.find(l => l.schema === cur.schema && l.name === tableName) &&
        !rtnSub.find(l => l.schema === cur.schema && l.name === tableName)
      ) {
        rtnSub.push({ schema: cur.schema, name: cur.tableName });
      }
    });

    if (!rtnSub.length) throwInvalid('table', name);
    rtn.push(...rtnSub);
  });

  return rtn.length ? rtn : undefined;
};
