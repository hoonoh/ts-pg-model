import { pascalCase } from 'change-case';

import { Config } from '../config/types/config.js';
import { resolveOutputPath } from './helpers/output-path.js';
import { TsMorphHelper } from './helpers/ts-morph.js';

export const generateEnumFiles = async (config: Config) => {
  await Promise.all(
    Object.entries(config.enumTypes).map(async ([schema, enumType]) => {
      const outputPath = resolveOutputPath({
        schema,
        filename: `${config.conventions.paths('enum-types')}.ts`,
        config,
      });
      const tsMorph = new TsMorphHelper(outputPath);
      const sourceFile = tsMorph.sourceFile;
      Object.entries(enumType).forEach(([pgEnumNameRaw, pgEnum]) => {
        const pgEnumName = pascalCase(pgEnumNameRaw);
        sourceFile.addEnum({
          name: pgEnumName,
          isExported: true,
          members: pgEnum.labels.map(l => ({ name: config.conventions.types(l), value: l })),
          docs: [`@enumType ${schema}.${pgEnumNameRaw}`],
        });
      });
      await tsMorph.save();
    }),
  );
};
