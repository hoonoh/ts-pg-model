import { pascalCase } from 'change-case';

import { Config } from '../config';
import { resolveOutputPath } from './helpers/output-path';
import { startProject } from './helpers/ts-morph';

export const generateEnumFiles = async (config: Config) => {
  await Promise.all(
    Object.entries(config.enumTypes).map(async ([schema, enumType]) => {
      const outputPath = resolveOutputPath({
        schema,
        filename: `${config.conventions.paths('enum-types')}.ts`,
        config,
      });
      const { project, sourceFile } = startProject(outputPath);
      Object.entries(enumType).forEach(([pgEnumNameRaw, pgEnum]) => {
        const pgEnumName = pascalCase(pgEnumNameRaw);
        sourceFile.addEnum({
          name: pgEnumName,
          isExported: true,
          members: pgEnum.labels.map(l => ({ name: config.conventions.types(l), value: l })),
        });
      });
      await project.save();
    }),
  );
};
