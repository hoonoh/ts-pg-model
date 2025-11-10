import z from 'zod';

import { TsType } from './type-map.js';

// todo: refactor into querries.ts

export const pgEnumTypeBareZod = z.object({
  schema: z.string(),
  name: z.string(),
  label: z.string(),
  sortOrder: z.number(),
});

export type PgEnumTypeBare = z.infer<typeof pgEnumTypeBareZod>;

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

export const pgCompositeTypeBareZod = z.object({
  schema: z.string(),
  name: z.string(),
  attributeName: z.string(),
  sortOrder: z.number(),
  type: z.string(),
  userType: z.nullable(z.enum(['enum', 'composite'])),
});

export type PgCompositeTypeBare = z.infer<typeof pgCompositeTypeBareZod>;

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

export const pgIndexBareZod = z.object({
  schema: z.string(),
  tableName: z.string(),
  indexName: z.string(),
  definition: z.custom<`CREATE ${string}INDEX ${string} ON ${string} USING ${string} (${string})`>(
    val =>
      typeof val === 'string' &&
      /^CREATE (\w+)INDEX (\w+) ON (\w+) USING (\w+) \((\w+)\)$/.test(val),
  ),
});

export type PgIndexBare = z.infer<typeof pgIndexBareZod>;

export const pgConstraintsBareZod = z
  .object({
    schema: z.string(),
    tableName: z.string(),
    constraintName: z.string(),
  })
  .and(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('p'),
        definition: z.custom<`PRIMARY KEY (${string})`>(
          val => typeof val === 'string' && /^PRIMARY KEY \((\w+)\)$/.test(val),
        ),
      }),
      z.object({
        type: z.literal('f'),
        definition: z.custom<`FOREIGN KEY (${string}) REFERENCES ${string}(${string})`>(
          val =>
            typeof val === 'string' &&
            /^FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)$/.test(val),
        ),
      }),
      z.object({
        type: z.literal('u'),
        definition: z.custom<`UNIQUE (${string})`>(
          val => typeof val === 'string' && /^UNIQUE \((\w+)\)$/.test(val),
        ),
      }),
      z.object({
        type: z.literal('c'),
        definition: z.custom<`CHECK (${string})`>(
          val => typeof val === 'string' && /^CHECK \((\w+)\)$/.test(val),
        ),
      }),
      z.object({
        type: z.literal('x'),
        definition: z.custom<`EXCLUDE USING ${string} (${string})`>(
          val => typeof val === 'string' && /^EXCLUDE USING (\w+) \((\w+)\)$/.test(val),
        ),
      }),
      z.object({
        type: z.literal('n'),
        definition: z.custom<`NOT NULL ${string}`>(
          val => typeof val === 'string' && /^NOT NULL \((\w+)\)$/.test(val),
        ),
      }),
    ]),
  );

export type PgConstraintsBare = z.infer<typeof pgConstraintsBareZod>;
