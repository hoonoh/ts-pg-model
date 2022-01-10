import { TsType } from './type-map';

export type PgEnumTypeBare = {
  schema: string;
  name: string;
  label: string;
  sortOrder: number;
};

export type PgEnumType = Omit<PgEnumTypeBare, 'label' | 'sortOrder'> & {
  labels: string[];
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
  type: string;
  sortOrder: number;
};

export type PgCompositeType = Pick<PgCompositeTypeBare, 'schema' | 'name'> & {
  attributes: Record<string, TsType | PgEnumType | PgCompositeType>;
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
