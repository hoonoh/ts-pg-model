import esbuild from 'esbuild';
import { rm, stat } from 'fs/promises';
import meow from 'meow';
import ora from 'ora';
import { tmpdir } from 'os';
import { basename, extname, relative, resolve } from 'path';
import { cwd } from 'process';

import { UserConfig } from './config/types/config.js';
import { parseConfigFile } from './config/validators/parse-config-file.js';
import { validateUserConfig } from './config/validators/user-config.js';
import { generateBarrel } from './generators/barrel.js';
import { generateCompositeFiles } from './generators/composite-type.js';
import { generateEnumFiles } from './generators/enum-type.js';
import { generateJsonTypeFile } from './generators/json-type.js';
import { generateTableFile } from './generators/table.js';

const args = meow(
  `
  // todo: add cli help text
`,
  {
    importMeta: import.meta,
    flags: {
      configPath: {
        type: 'string',
        alias: 'c',
        isRequired: true,
      },
    },
  },
);

const exit = async (configTranspilePath?: string, code = 0) => {
  try {
    if (configTranspilePath) await rm(configTranspilePath);
  } catch (error) {
    //
  }
  process.exit(code);
};

export const cliStart = async () => {
  const configPath = resolve(cwd(), args.flags.configPath);

  try {
    await stat(configPath);
  } catch (error) {
    ora(`invalid config file path ${configPath}`).fail();
    exit();
  }

  const spinner = ora().info('ts-pg-model');

  const configTranspilePath = resolve(
    tmpdir(),
    basename(args.flags.configPath).replace(extname(args.flags.configPath), '.mjs'),
  );

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
    spinner.fail(
      [
        `Failed to find configuration in file ${configPath}.`,
        'Configuration file requires settings exported as default or by named export as `userConfig`',
      ].join('\n'),
    );
    exit(configTranspilePath, 1);
  }

  const configPrefix = '[config] ';
  spinner.start(`${configPrefix}Checking for JSON map definitions...`);
  const jsonTypeDefinitions = parseConfigFile(configPath);
  if (jsonTypeDefinitions && userConfig.typeMap) {
    userConfig.typeMap.jsonDefinitions = jsonTypeDefinitions;
    spinner.succeed(`${configPrefix}${jsonTypeDefinitions.length} JSON map definition(s) found.`);
  } else {
    spinner.info(`${configPrefix}No JSON map definitions found.`);
  }

  spinner.start(`${configPrefix}Validating...`);
  const config = await validateUserConfig(userConfig);

  spinner.succeed(`${configPrefix}Validation successful.`);

  spinner.start(`Generating files...`);

  const generatedFilePaths = [
    ...(await generateEnumFiles(config)),
    ...(await generateCompositeFiles(config)),
    ...(await generateJsonTypeFile(config)),
    ...(await generateTableFile(config)),
    ...(await generateBarrel(config)),
  ];

  spinner.succeed(
    `Generated ${generatedFilePaths.length} file(s) in ${relative(cwd(), config.output.root)}.`,
  );

  // remove files which is not generated in current execution & not in `output.keepFiles` settings
  const { existingFilePaths, keepFiles } = config.output;
  existingFilePaths.map(async p => {
    if (!generatedFilePaths.includes(p) && !keepFiles.includes(p)) {
      await rm(p);
      spinner.start().warn(`Removed unused file ${relative(cwd(), p)}`);
    }
  });

  exit(configTranspilePath);
};

(async () => {
  cliStart();
})();

export default {};
