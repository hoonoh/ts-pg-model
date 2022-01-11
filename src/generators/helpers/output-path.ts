import { resolve } from 'path';

import { Config } from '../../config/index.js';

/**
 * Resolves output file path.
 *
 * If `config.schema.length > 1`, output path always includes schema name,
 * despite `includeSchemaPath` setting.
 */
export const resolveOutputPath = ({
  schema,
  filename,
  config,
}: {
  schema: string;
  filename: string;
  config: Config;
}) => {
  return resolve(
    config.output.root,
    ...(config.output.includeSchemaPath || config.schemas.length > 1
      ? [config.conventions.paths(schema), filename]
      : [filename]),
  );
};
