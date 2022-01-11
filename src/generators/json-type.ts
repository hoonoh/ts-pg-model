import { resolve } from 'path';

import { Config } from '../config';
import { startProject } from './helpers/ts-morph';

export const generateJsonTypeFile = async (config: Config) => {
  const outputPath = resolve(config.output.root, `${config.conventions.paths('json-types')}.ts`);

  const src = config.typeMap?.jsonDefinitions?.reduce((acc, [name, def]) => {
    acc += `\nexport type ${name} = ${def}\n`;
    return acc;
  }, '');

  if (src) {
    const { project, sourceFile } = startProject(outputPath, src);
    sourceFile.formatText();
    await project.save();
  }
};
