import simpleImportSort from 'eslint-plugin-simple-import-sort';
import _import from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-plugin-prettier';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import babelParser from '@babel/eslint-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['**/node_modules/', '**/.yarn', '**/dist', '**/generated', '**/zz-test*.*'],
  },
  ...compat.extends('prettier'),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: fixupPluginRules(_import),
      'unused-imports': unusedImports,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        BigInt: true,
      },

      ecmaVersion: 2018,
      sourceType: 'module',
    },

    rules: {
      'import/no-extraneous-dependencies': 0,
      'import/prefer-default-export': 0,
      'no-console': 0,
      'no-param-reassign': 0,
      'prettier/prettier': 2,
      'import/extensions': 0,
      'simple-import-sort/imports': 2,
      'simple-import-sort/exports': 2,
      'import/first': 2,
      'import/newline-after-import': 2,
      'import/no-duplicates': 2,
      'unused-imports/no-unused-imports': 2,
      'no-underscore-dangle': 0,
    },
  },
  ...compat.extends('plugin:@typescript-eslint/recommended', 'prettier').map(config => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],

    plugins: {
      'simple-import-sort': simpleImportSort,
      import: fixupPluginRules(_import),
      'unused-imports': unusedImports,
      prettier,
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2018,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.json',
      },
    },

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },

      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx'],
        },
      },
    },

    rules: {
      'import/no-extraneous-dependencies': 0,
      'import/prefer-default-export': 0,
      'no-console': 0,
      'no-param-reassign': 0,
      'prettier/prettier': 2,
      'import/extensions': 0,
      'simple-import-sort/imports': 2,
      'simple-import-sort/exports': 2,
      'import/first': 2,
      'import/newline-after-import': 2,
      'import/no-duplicates': 2,
      'unused-imports/no-unused-imports': 2,
      'no-underscore-dangle': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
    },
  },
  {
    files: ['bin/cli.mjs'],

    languageOptions: {
      parser: babelParser,
      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,
      },
    },
  },
];
