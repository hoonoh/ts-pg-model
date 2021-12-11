# ts-pg-model

Generates Typescript type definitions from live Postgres server.

## Configuration

### Postgres connection

You can assign `connectionURI` in configuration or use `PG_CONNECTION_URI` environment variable.
URI value must follow valid Postgres URI scheme starting with `postgresql://` or `postgres://`.

[`dotenv`](https://www.npmjs.com/package/dotenv) is also supported. You can also set `.env` file
location with `dotEnvPath` in configuration.

### Naming convensions

You can choose naming convensions of schemas, tables and columns. Choices are open to all
methods provided by [`change-case`](https://www.npmjs.com/package/change-case).

e.g. Transform column name `created_at` to camel cased `createdAt`;

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

#### Example

```ts
const config: UserConfig = {
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
        // excludes `users.sessions` table.
        tables: ['sessions'],
        // excludes `created_at`, `updated_at` columns in all
        columns: ['created_at', 'updated_at'],tables.
      },
    },
    {
      include: {
        // include `users.sessions` again.
        // be noted that all columns including `created_at` column in this table will be included
        // despite all columns with name `created_at` was removed in previous exclude rule.
        tables: ['sessions'],
        // includes `media.images.updated_at` column, despite `updated_at` column was excluded.
        columns: ['media.images.updated_at'],
      },
    },
  ],
};
```

## Type definition output

### Single Schema Mode

### Multi Schema Mode
