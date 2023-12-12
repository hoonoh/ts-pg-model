import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
} from 'change-case';

import { ChangeCase } from '../../config/types/config.js';

export const changeCase = (input: string, caseType?: ChangeCase) => {
  let rtn = input;
  switch (caseType) {
    case 'camelCase':
      rtn = camelCase(input);
      break;
    case 'capitalCase':
      rtn = capitalCase(input);
      break;
    case 'constantCase':
      rtn = constantCase(input);
      break;
    case 'dotCase':
      rtn = dotCase(input);
      break;
    case 'kebabCase':
      rtn = kebabCase(input);
      break;
    case 'noCase':
      rtn = noCase(input);
      break;
    case 'pascalCase':
      rtn = pascalCase(input);
      break;
    case 'pathCase':
      rtn = pathCase(input);
      break;
    case 'sentenceCase':
      rtn = sentenceCase(input);
      break;
    case 'snakeCase':
      rtn = snakeCase(input);
      break;
    case 'trainCase':
      rtn = trainCase(input);
      break;
    default:
      break;
  }
  return rtn;
};
