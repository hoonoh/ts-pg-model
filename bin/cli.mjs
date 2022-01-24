#!/usr/bin/env node

import chalk from 'chalk';
import meow from 'meow';
import { resolve } from 'path';
import { cwd } from 'process';

import cli from '../dist/cli/cli.js';

const args = meow(
  `
    ${chalk.bold('Usage')}
      $ npx  ${chalk.underline('ts-pg-model')} <config file path>
      $ yarn ${chalk.underline('ts-pg-model')} <config file path>
  `,
  {
    importMeta: import.meta,
  },
);

if (!args.input[0]) {
  process.stdout.write(args.help);
  process.exit(1);
}

await cli.run(resolve(cwd(), args.input[0]));
