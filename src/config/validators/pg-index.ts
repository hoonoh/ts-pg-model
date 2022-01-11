import assert from 'assert';

import { Index } from '../types/config.js';
import { PgIndexBare } from '../types/pg.js';

export const validateIndexes = (indexBare: readonly PgIndexBare[]) => {
  const rtn: Index[] = [];
  indexBare.forEach(index => {
    // CREATE INDEX sessions_user_id_index ON users.sessions USING btree (user_id)
    // CREATE UNIQUE INDEX name_unique ON users.users USING btree (name_first, name_last)
    const [, uniqueRaw, , , using, columnNamesJoined] =
      index.definition.match(/CREATE (UNIQUE )?INDEX (.+) ON (.+) USING (.+) \((.+)\)/) || [];
    const isUnique = !!uniqueRaw;
    const columnNames = columnNamesJoined.split(',').map(col => col.trim());
    assert(
      index.schema &&
        index.tableName &&
        index.indexName &&
        index.definition &&
        isUnique !== undefined &&
        using &&
        columnNames.length,
      'index definition parse failed',
    );
    rtn.push({
      schema: index.schema,
      tableName: index.tableName,
      name: index.indexName,
      definition: index.definition,
      isUnique,
      using,
      columnNames,
      docs: `@index \`${using}\` ${index.indexName} (${columnNames.join(', ')})`,
    });
  });
  return rtn;
};
