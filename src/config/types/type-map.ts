// https://www.postgresql.org/docs/current/datatype.html

import z from 'zod';

export type TsType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'Buffer'
  | 'Date'
  | 'JsonType'
  | 'Timestamp'
  | 'unknown';

export const knownPgTypes = [
  'bigint',
  'int8',
  'bigserial',
  'serial8',
  'double precision',
  'float8',
  'integer',
  'int',
  'int4',
  'money',
  'numeric',
  'decimal',
  'real',
  'float4',
  'smallint',
  'int2',
  'smallserial',
  'serial2',
  'serial',
  'serial4',
  'bit',
  'bit varying',
  'varbit',
  'character',
  'char',
  'character varying',
  'varchar',
  'cidr',
  'inet',
  'macaddr',
  'macaddr8',
  'text',
  'uuid',
  'boolean',
  'bool',
  'bytea',
  'date',
  'interval',
  'time',
  'time without time zone',
  'timetz',
  'time with time zone',
  'timestamp',
  'timestamp without time zone',
  'timestamptz',
  'timestamp with time zone',
  'json',
  'jsonb',
  'box',
  'circle',
  'line',
  'lseg',
  'path',
  'pg_lsn',
  'pg_snapshot',
  'point',
  'polygon',
  'tsquery',
  'tsvector',
  'txid_snapshot',
  'citext',
  'xml',
] as const;

export const knownPgTypesZod = z.enum(knownPgTypes);
export type KnownPgType = z.infer<typeof knownPgTypesZod>;

export const isKnownPgType = (name: any): name is KnownPgType => {
  return knownPgTypes.includes(name);
};

export const knownPgTypeToTsTypesMap: Readonly<Record<KnownPgType, TsType>> = {
  // numbers
  bigint: 'number',
  int8: 'number',
  bigserial: 'number',
  serial8: 'number',
  'double precision': 'number',
  float8: 'number',
  integer: 'number',
  int: 'number',
  int4: 'number',
  money: 'number',
  numeric: 'number',
  decimal: 'number',
  real: 'number',
  float4: 'number',
  smallint: 'number',
  int2: 'number',
  smallserial: 'number',
  serial2: 'number',
  serial: 'number',
  serial4: 'number',

  // strings
  bit: 'string',
  'bit varying': 'string',
  varbit: 'string',
  character: 'string',
  char: 'string',
  'character varying': 'string',
  varchar: 'string',
  cidr: 'string',
  inet: 'string',
  macaddr: 'string',
  macaddr8: 'string',
  text: 'string',
  uuid: 'string',
  citext: 'string',

  // boolean
  boolean: 'boolean',
  bool: 'boolean',

  // Buffer
  bytea: 'Buffer',

  // Date
  date: 'Date',
  interval: 'Date',
  time: 'Date',
  'time without time zone': 'Date',
  timetz: 'Date',
  'time with time zone': 'Date',
  timestamp: 'Timestamp',
  'timestamp without time zone': 'Timestamp',
  timestamptz: 'Timestamp',
  'timestamp with time zone': 'Timestamp',

  // JsonType
  json: 'JsonType',
  jsonb: 'JsonType',

  // unhandled
  box: 'unknown',
  circle: 'unknown',
  line: 'unknown',
  lseg: 'unknown',
  path: 'unknown',
  pg_lsn: 'unknown',
  pg_snapshot: 'unknown',
  point: 'unknown',
  polygon: 'unknown',
  tsquery: 'unknown',
  tsvector: 'unknown',
  txid_snapshot: 'unknown',
  xml: 'unknown',
} as const;
