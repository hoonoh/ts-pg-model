import { TsType } from './pg-map';

export type PgEnumTypeBare = {
  schema: string;
  name: string;
  label: string;
};

export type PgEnumType = Omit<PgEnumTypeBare, 'label'> & {
  labels: string[];
};

export type PgCompositeTypeBare = {
  schema: string;
  name: string;
  attributeName: string;
  type: string;
};

export type PgCompositeType = Pick<PgCompositeTypeBare, 'schema' | 'name'> & {
  attributes: Record<string, TsType | PgEnumType>;
};
