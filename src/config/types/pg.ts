import { TsType } from './type-map.js';

// todo: refactor into querries.ts

export type PgEnumTypeBare = {
  schema: string;
  name: string;
  label: string;
  sortOrder: number;
};

export type PgEnumType = Omit<PgEnumTypeBare, 'label' | 'sortOrder'> & {
  labels: string[];
};

export const isPgEnumType = (input: any): input is PgEnumType => {
  return input.labels !== undefined;
};

/**
 * {
 *  [schema name]: {
 *    [enum type name]: {
 *      labels: string[]
 *    }
 *  }
 * }
 */
export type PgEnumTypes = Record<string, Record<string, PgEnumType>>;

export type PgCompositeTypeBare = {
  schema: string;
  name: string;
  attributeName: string;
  sortOrder: number;
  type: string;
  userType: 'enum' | 'composite' | null;
};

export type PgCompositeType = Pick<PgCompositeTypeBare, 'schema' | 'name'> & {
  attributes: Record<string, TsType | PgEnumType | PgCompositeType>;
};

export const isPgCompositeType = (input: any): input is PgCompositeType => {
  return input.attributes !== undefined;
};

/**
 * {
 *  [schema name]: {
 *    [composite type name]: {
 *      attributes: {
 *        [attribute name]: TsType | PgEnumType
 *      }
 *    }
 *  }
 * }
 */
export type PgCompositeTypes = Record<string, Record<string, PgCompositeType>>;

export type PgIndexBare = {
  schema: string;
  tableName: string;
  indexName: string;
  definition: `CREATE ${string}INDEX ${string} ON ${string} USING ${string} (${string})`;
};

export type PgConstraintsBare = {
  schema: string;
  tableName: string;
  constraintName: string;
} & (
  | {
      type: 'p';
      definition: `PRIMARY KEY (${string})`;
    }
  | {
      type: 'f';
      definition: `FOREIGN KEY (${string}) REFERENCES ${string}(${string})`;
    }
  | {
      type: 'u';
      definition: `UNIQUE (${string})`;
    }
  | {
      type: 'c';
      definition: `CHECK (${string})`;
    }
  | {
      type: 'x';
      definition: `EXCLUDE USING ${string} (${string})`;
    }
);
