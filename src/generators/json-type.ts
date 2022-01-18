import { resolve } from 'path';

import { Config } from '../config/types/config.js';
import { saveProject, startProject } from './helpers/ts-morph.js';

export const generateJsonTypeFile = async (config: Config) => {
  const outputPath = resolve(config.output.root, `${config.conventions.paths('json-types')}.ts`);

  // todo: parse and generate defs with ts-morph
  const src = config.typeMap?.jsonDefinitions
    ?.map(([name, def]) => `export type ${name} = ${def}`)
    .join('\n\n');

  if (src) {
    const { project, sourceFile, prevSource } = await startProject(outputPath, src);
    await saveProject({ project, sourceFile, prevSource });
  }
};
