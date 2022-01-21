import { Config } from '../config/types/config.js';

/**
 * @returns string array of generated files
 */
export type FileGenerator = (config: Config) => Promise<string[]>;
