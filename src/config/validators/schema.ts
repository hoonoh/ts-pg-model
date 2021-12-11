import { throwInvalid } from './error';

export const validateSchema = ({
  names,
  allSchemas,
}: {
  names: string[];
  allSchemas: string[];
}) => {
  names.forEach(name => {
    if (!allSchemas.includes(name)) throwInvalid('schemas', name);
  });

  return names;
};
