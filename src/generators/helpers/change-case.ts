import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  headerCase,
  noCase,
  paramCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
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
    case 'headerCase':
      rtn = headerCase(input);
      break;
    case 'noCase':
      rtn = noCase(input);
      break;
    case 'paramCase':
      rtn = paramCase(input);
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
    default:
      break;
  }
  return rtn;
};
