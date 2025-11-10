import { Constraint } from '../types/config.js';
import { PgConstraintsBare } from '../types/pg.js';

export const validateConstratints = (constraintsBare: readonly PgConstraintsBare[]) => {
  const rtn: Constraint[] = [];
  constraintsBare.forEach(c => {
    let type: Constraint['type'] = 'PrimaryKey';
    const columnNames: string[] = [];
    let match: RegExpMatchArray | null;
    let columns: string[] | undefined;
    let docs = '';
    switch (c.type) {
      case 'p':
        type = 'PrimaryKey';
        // PRIMARY KEY (id1, id2)
        match = c.definition.match(/PRIMARY KEY \((.+?)\)/);
        columns = match?.[1].split(',').map(col => col.trim());
        if (columns) columnNames.push(...columns);
        docs = `@primaryKey ${c.constraintName} (${columns?.join(', ')})`;
        break;
      case 'f':
        type = 'ForeignKey';
        // FOREIGN KEY (name_first, name_last) REFERENCES users.users(name_first, name_last)
        match = c.definition.match(/FOREIGN KEY \((.+?)\) REFERENCES (.+?)\((.+?)\)/);
        columns = match?.[1].split(',').map(col => col.trim());
        const refTable = match?.[2] || '';
        const refColumns = match?.[3].split(',').map(col => col.trim()) || [];
        if (columns) columnNames.push(...columns);
        if (columns && columns.length > 1) {
          docs =
            `@foreignKey ` +
            `${c.constraintName} ((${columns.join(', ')})->` +
            `${refTable}(${refColumns.join(', ')}))`;
        } else {
          docs = `@foreignKey ${c.constraintName} (${refTable}(${refColumns.join(', ')}))`;
        }
        break;
      case 'u':
        type = 'Unique';
        // UNIQUE (name_first, name_last)
        match = c.definition.match(/UNIQUE \((.+?)\)/);
        columns = match?.[1].split(',').map(col => col.trim());
        if (columns) columnNames.push(...columns);
        docs = `@unique ${c.constraintName} (${columns?.join(', ')})`;
        break;
      case 'c':
        type = 'Check';
        // CHECK ((((name_first IS NOT NULL) AND ((name_last IS NOT NULL) OR (email IS NOT NULL))) OR (NOT (note IS NULL))))
        match = c.definition.match(/CHECK (.+)/);
        columns = match?.[1]
          .split(/AND|OR/)
          .map(col =>
            col
              .replace(/\(|\)|NOT/g, '')
              .trim()
              .split(' ')
              .shift(),
          )
          .filter(col => !!col) as string[] | undefined;
        if (columns) columnNames.push(...columns);
        docs = `@check ${c.constraintName} (${match?.[1]})`;
        break;
      case 'x':
        type = 'Exclude';
        // EXCLUDE USING gist (alias WITH =, email WITH <>)
        match = c.definition.match(/EXCLUDE USING (.+?) \((.+?)\)/);
        columns = match?.[2]
          .split(',')
          .map(col => col.trim().split(' ').shift())
          .filter(col => !!col) as string[] | undefined;
        if (columns) columnNames.push(...columns);
        docs = `@exclude ${c.constraintName} (${c.definition.split('EXCLUDE USING ').pop()})`;
        break;
      case 'n':
        type = 'NotNull';
        // NOT NULL created_at
        match = c.definition.match(/NOT NULL (.+)/);
        columns = match?.[1] ? [match[1].trim()] : undefined;
        if (columns) columnNames.push(...columns);
        docs = `@notNull ${c.constraintName} (${columns?.[0]})`;
        break;
    }
    const constraint: Constraint = {
      schema: c.schema,
      tableName: c.tableName,
      name: c.constraintName,
      type,
      definition: c.definition,
      columnNames,
      docs,
    };
    rtn.push(constraint);
  });
  return rtn.length ? rtn : undefined;
};
