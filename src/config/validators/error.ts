import { ConfigKey } from '../types';

export const throwInvalid = (key: ConfigKey, name: string) => {
  throw new Error(`invalid ${key} name: "${name}"`);
};
