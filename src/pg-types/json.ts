export type JSONType =
  | number
  | string
  | boolean
  | null
  | readonly JSONType[]
  | {
      [key: string]: JSONType | undefined;
    };
