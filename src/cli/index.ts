import meow from 'meow';
import { resolve } from 'path';
import { cwd } from 'process';

import cli from './cli.js';

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

(async () => {
  await cli.run(resolve(cwd(), args.flags.configPath));
})();

export default {};
