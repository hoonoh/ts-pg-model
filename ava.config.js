export default ({ projectDir }) => {
  return {
    extensions: ['ts'],
    require: ['ts-node/register/transpile-only'],
    files: ['src/**/*.spec.ts'],
  };
};
