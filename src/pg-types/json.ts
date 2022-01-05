export type JsonType =
  | number
  | string
  | boolean
  | null
  | readonly JsonType[]
  | {
      [key: string]: JsonType | undefined;
    };
