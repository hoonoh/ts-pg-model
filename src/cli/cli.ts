import esbuild from 'esbuild';
import { rm, stat } from 'fs/promises';
import ora, { Ora } from 'ora';
import { tmpdir } from 'os';
import { basename, extname, relative, resolve } from 'path';
import { cwd } from 'process';
import { DatabasePool } from 'slonik';

import { Config, UserConfig } from '../config/types/config.js';
import { parseConfigFile } from '../config/validators/parse-config-file.js';
import { validateUserConfig } from '../config/validators/user-config.js';
import { generateBarrel } from '../generators/barrel.js';
import { generateCompositeFiles } from '../generators/composite-type.js';
import { generateEnumFiles } from '../generators/enum-type.js';
import { generateJsonTypeFile } from '../generators/json-type.js';
import { generateTableFile } from '../generators/table.js';

const cli = {
  tmpRoot: resolve(tmpdir(), 'ts-pg-model'),

  exit: async ({
    configTranspilePath,
    code,
    spinner,
    skipProcessExit,
  }: {
    configTranspilePath?: string;
    code?: number;
    spinner?: Ora;
    skipProcessExit?: boolean;
  } = {}) => {
    try {
      if (configTranspilePath) await rm(configTranspilePath);
      /* c8 ignore start */
    } catch (error) {
      spinner?.warn(`failed to delete temp file ${configTranspilePath}`);
    }
    try {
      await rm(cli.tmpRoot, { recursive: true });
    } catch (error) {
      //
    }
    if (!skipProcessExit) process.exit(code || 0);
    /* c8 ignore stop */
  },

  run: async (
    configPath: string,
    {
      pool,
      silent,
      skipProcessExit,
      configTranspilePath,
    }: {
      pool?: DatabasePool;
      silent?: boolean;
      skipProcessExit?: boolean;
      configTranspilePath?: string;
    } = {},
  ) => {
    /* c8 ignore next */
    const spinner = !silent ? ora().info('ts-pg-model') : undefined;

    try {
      await stat(configPath);
    } catch (error) {
      /* c8 ignore next */
      spinner?.fail(`invalid config file path ${configPath}`);
      return cli.exit({ code: 1, skipProcessExit });
    }

    /* c8 ignore start */
    configTranspilePath ??= resolve(
      cli.tmpRoot,
      basename(configPath).replace(extname(configPath), '.mjs'),
    );
    /* c8 ignore stop */

    await esbuild.build({
      bundle: false,
      platform: 'node',
      target: 'es2019',
      minify: false,
      legalComments: 'none',
      entryPoints: [configPath],
      outfile: configTranspilePath,
    });

    const userConfigImport = await import(configTranspilePath);
    const userConfig: UserConfig = userConfigImport.userConfig || userConfigImport.default;

    if (!userConfig) {
      /* c8 ignore start */
      spinner?.fail(
        [
          `Failed to find configuration in file ${configPath}.`,
          'Configuration file requires settings exported as default or by named export as `userConfig`',
        ].join('\n'),
      );
      /* c8 ignore stop */
      return cli.exit({ configTranspilePath, code: 1, skipProcessExit });
    }

    const configPrefix = '[config] ';
    /* c8 ignore next */
    spinner?.start(`${configPrefix}Checking for JSON map definitions...`);
    const jsonTypeDefinitions = parseConfigFile(configPath);
    if (jsonTypeDefinitions && userConfig.typeMap) {
      userConfig.typeMap.jsonDefinitions = jsonTypeDefinitions;
      /* c8 ignore start */
      spinner?.succeed(
        `${configPrefix}${jsonTypeDefinitions.length} JSON map definition(s) found.`,
      );
    } else {
      spinner?.info(`${configPrefix}No JSON map definitions found.`);
    }
    /* c8 ignore stop */

    /* c8 ignore next */
    spinner?.start(`${configPrefix}Validating...`);
    let config: Config | undefined;

    try {
      config = await validateUserConfig({ ...userConfig, pool });
    } catch (error) {
      spinner?.fail(`${configPrefix}Validation error: ${(error as Error).message}`);
      return cli.exit({ configTranspilePath, code: 1, skipProcessExit });
    }

    /* c8 ignore next */
    spinner?.succeed(`${configPrefix}Validation successful.`);

    /* c8 ignore next */
    spinner?.start(`Generating files...`);

    const generatedFilePaths = [
      ...(await generateEnumFiles(config)),
      ...(await generateCompositeFiles(config)),
      ...(await generateJsonTypeFile(config)),
      ...(await generateTableFile(config)),
      ...(await generateBarrel(config)),
    ];

    /* c8 ignore start */
    spinner?.succeed(
      `Generated ${generatedFilePaths.length} file(s) in ${relative(cwd(), config.output.root)}.`,
    );
    /* c8 ignore stop */

    // remove files which are not generated in current execution & not in `output.keepFiles` settings
    const { existingFilePaths, keepFiles } = config.output;
    existingFilePaths.map(async p => {
      if (!generatedFilePaths.includes(p) && !keepFiles.includes(p)) {
        await rm(p);
        /* c8 ignore next */
        spinner?.start().warn(`Removed unused file ${relative(cwd(), p)}`);
      }
    });

    return cli.exit({ configTranspilePath, skipProcessExit });
  },
};

export default cli;
