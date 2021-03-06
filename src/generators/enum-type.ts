import { pascalCase } from 'change-case';

import { Config } from '../config/types/config.js';
import { FileGenerator } from './generator.js';
import { resolveOutputPath } from './helpers/output-path.js';
import { TsMorphHelper } from './helpers/ts-morph.js';

export const generateEnumFiles: FileGenerator = async (config: Config) => {
  return Promise.all(
    Object.entries(config.enumTypes).map(async ([schema, enumType]) => {
      const outputPath = resolveOutputPath({
        schema,
        filename: `${config.conventions.paths('enum-types')}.ts`,
        config,
      });
      const tsMorph = new TsMorphHelper(outputPath, config);
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
      return tsMorph.sourcePath;
    }),
  );
};
