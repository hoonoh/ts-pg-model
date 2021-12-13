import { pascalCase } from 'change-case';

import { Config } from '../config';
import { resolveOutputPath } from './helpers/output-path';
import { startProject } from './helpers/ts-morph';

export const generateEnumFiles = async (config: Config) => {
  await Promise.all(
    Object.entries(config.enumTypes).map(async ([schema, enumType]) => {
      const outputPath = resolveOutputPath({ schema, filename: 'enum-types.ts', config });
      const { project, sourceFile } = startProject(outputPath);
      Object.entries(enumType).forEach(([pgEnumName, pgEnum]) => {
        sourceFile.addEnum({
          name: pascalCase(pgEnumName),
          isExported: true,
          members: pgEnum.labels.map(l => ({ name: l, value: l })),
        });
      });
      await project.save();
    }),
  );
};
