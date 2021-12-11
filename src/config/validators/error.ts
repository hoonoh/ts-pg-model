import { ConfigKey } from '../types';

export const throwInvalid = (key: ConfigKey, name: string) => {
  throw new Error(`invalid ${key.substring(0, key.length - 1)} name: "${name}"`);
};
