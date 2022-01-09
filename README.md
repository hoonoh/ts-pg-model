# ts-pg-model

Generates Typescript type definitions from live Postgres server.

## Configuration

### Postgres connection

You can assign `connectionURI` in configuration or use `PG_CONNECTION_URI` environment variable.
URI value must follow valid Postgres URI scheme starting with `postgresql://` or `postgres://`.

[`dotenv`](https://www.npmjs.com/package/dotenv) is also supported. You can also set `.env` file
location with `dotEnvPath` in configuration.

### Naming convensions

```ts
export type ChangeCase =
  | 'camelCase'
  | 'capitalCase'
  | 'constantCase'
  | 'dotCase'
  | 'headerCase'
  | 'noCase'
  | 'paramCase'
  | 'pascalCase'
  | 'pathCase'
  | 'sentenceCase'
  | 'snakeCase'
  | 'keep';

const config: UserConfig = {
  conventions: {
    schemas: 'camelCase',
    columns: 'keep',
    types: 'camelCase',
    paths: 'paramCase',
  },
};
```

#### Code convensions

You can choose code convensions of schemas, columns and types. Choices are open to all methods
provided by [`change-case`](https://www.npmjs.com/package/change-case) or `keep` (no transform).

##### Schema names

Schema code convensions are applied to namespaces. Defaults to `camelCase`.

##### Column names

Column code conventions are applied to column names. Defaults to `keep`. Can be useful if you prefer
automatic column name transformation to `camelCase`, etc.

##### Enum Types

Enum type code conventions are applied to Enum member names. Defaults to `camelCase`.

#### Paths and filename conventions

Generated file paths and filename conventions. Defaults to `paramCase`.

### Selecting targets

You can target schemas, tables and columns using target selectors.

#### schema

If undefined, default schemas will be chosen by the result of `show search_path` query, excluding
`"$user"`. In most of user cases, the result would be `["public"]`.

#### tables & columns

Tables and columns can be explicitly included or excluded using `targetSelectors` configuration.
`targetSelectors` is a series of filters which includes or excludes targets in order.

You can define table / columns names with dot notation, including schema / table names.

If schema / tables names are not defined using dot notation, all matching targets will be
included / excluded.

### Type mapping

#### User defined types (UDT)

Most of known Postgres types should be mapped automatically. If there is an unknown data type that
needs casting into a primitive type, use `typeMap.udt` settings. Array type (e.g. `_text`, with
underscore prefix in `udt_name`) should be automatically handled.

#### JSON(B) definitions

User defined JSON(B) types can be achived via `typeMap.json` settings & type definitions in the
settings file. When `typeMap.json` is defined, this will require JSON type definitions as
`UserConfig` arguments (`UserConfig<JsonTypeMap>`).

#### Example

```ts
export interface JsonTypeMap extends Record<string, JsonType> {
  MediaMetadata: {
    width: number;
    height: number;
  };
}

// `UserConfig` variable has to be either exported via named export (with name `userConfig`) or default export
export const userConfig: UserConfig<JsonTypeMap> = {
  // includes `users` schema only.
  schemas: ['users'],
  targetSelectors: [
    {
      include: {
        // includes `media.images` table, despite `media` schema was not included.
        tables: ['media.images'],
      },
    },
    {
      exclude: {
        // excludes all tables with name `sessions`, in this case `users.sessions` table.
        tables: ['sessions'],
        // excludes `created_at`, `updated_at` columns in all tables
        columns: ['created_at', 'updated_at'],
      },
    },
    {
      include: {
        // include `users.sessions` again.
        // be noted that all columns including `created_at` column in this table will be included
        // despite all columns with name `created_at` was removed in previous exclude rule.
        tables: ['sessions'],
        // includes `media.images.updated_at` column, despite all `updated_at` columns were excluded.
        columns: ['media.images.updated_at'],
      },
    },
  ],
  typeMap: {
    json: [
      {
        schema: 'media',
        tableName: 'images',
        columnName: 'metadata',
        name: 'MediaMetadata',
      },
    ],
  },
  conventions: {
    columns: 'camelCase',
  },
};
```

## Type definition output

### Single Schema Mode

### Multi Schema Mode
