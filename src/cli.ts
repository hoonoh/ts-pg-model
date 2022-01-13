import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { rm, stat } from 'fs/promises';
import meow from 'meow';
import ora from 'ora';
import { tmpdir } from 'os';
import { basename, extname, resolve } from 'path';
import { cwd } from 'process';

import { UserConfig } from './config/types/config.js';
import { parseConfigFile } from './config/validators/parse-config-file.js';
import { validateUserConfig } from './config/validators/user-config.js';
import { generateBarrel } from './generators/barrel.js';
import { generateCompositeFiles } from './generators/composite-type.js';
import { generateEnumFiles } from './generators/enum-type.js';
import { generateJsonTypeFile } from './generators/json-type.js';
import { generateTableFile } from './generators/table.js';

const cli = meow(
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

(async () => {
  const configPath = resolve(cwd(), cli.flags.configPath);

  try {
    await stat(configPath);
  } catch (error) {
    ora(`invalid config file path "${configPath}"`).fail();
    exit();
  }

  const spinner = ora('Transpiling config file').start();

  const configTranspilePath = resolve(
    tmpdir(),
    basename(cli.flags.configPath).replace(extname(cli.flags.configPath), '.mjs'),
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
        `Failed to find configuration in file "${configPath}".`,
        'Configuration file requires settings exported as default or by named export as `userConfig`',
      ].join('\n'),
    );
    exit(configTranspilePath, 1);
  }

  spinner.text = 'Checking config file for JSON Map Definitions';
  const jsonTypeDefinitions = parseConfigFile(configPath);
  if (jsonTypeDefinitions && userConfig.typeMap) {
    userConfig.typeMap.jsonDefinitions = jsonTypeDefinitions;
  }

  spinner.text = 'Validating config file';
  const config = await validateUserConfig(userConfig);

  await generateEnumFiles(config);
  await generateCompositeFiles(config);
  await generateJsonTypeFile(config);
  await generateTableFile(config);
  await generateBarrel(config);

  // todo: generate composite type file
  // todo: import pg types (Timestamp, JsonType, etc...)

  spinner.text = 'complete!';
  spinner.succeed();

  // ! temp ----------------- start
  writeFileSync(
    new URL('./zz-test.json', import.meta.url).pathname,
    JSON.stringify(config, null, 2),
  );
  // ! temp ----------------- end

  exit(configTranspilePath);
})();

export default {};
