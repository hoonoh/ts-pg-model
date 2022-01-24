import { resolve } from 'path';

import { Config } from '../config/types/config.js';
import { FileGenerator } from './generator.js';
import { TsMorphHelper } from './helpers/ts-morph.js';

export const generateJsonTypeFile: FileGenerator = async (config: Config) => {
  const outputPath = resolve(config.output.root, `${config.conventions.paths('json-types')}.ts`);

  // todo: parse and generate defs with ts-morph
  const src = config.typeMap?.jsonDefinitions
    ?.map(([name, def]) => `export type ${name} = ${def}`)
    .join('\n\n');

  if (src) {
    const tsMorph = new TsMorphHelper(outputPath, config, src);
    await tsMorph.save();
    return [tsMorph.sourcePath];
  }
  return [];
};
