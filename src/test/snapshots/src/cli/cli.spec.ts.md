# Snapshot report for `src/cli/cli.spec.ts`

The actual snapshot is saved in `cli.spec.ts.snap`.

Generated by [AVA](https://avajs.dev).

## 🧪 should generate single schema setup & remove unused files

> config.ts

    `␊
    import { Config } from 'ts-pg-model';␊
    ␊
    interface JsonTypeMap {␊
      FooType: {␊
        foo: string;␊
        bar: number;␊
        baz: {␊
          foobar: number;␊
          barbaz: string;␊
        };␊
      };␊
    }␊
    ␊
    export const userConfig: Config<JsonTypeMap> = {␊
      connectionURI: 'postgresql://postgres:secretpassword@localhost:54321/postgres',␊
      schemas: ['foo'],␊
      typeMap: {␊
        json: [␊
          {␊
            schema: 'foo',␊
            tableName: 'bar',␊
            columnName: 'bar_jsonb',␊
            name: 'FooType',␊
          },␊
        ],␊
      },␊
      output: {␊
        root: 'generated',␊
      },␊
    };␊
    `

> generated/bar.ts

    `/**␊
     * @note This file was generated with \`ts-pg-model\`.␊
     * @generated 2000-01-01T00:00:00.000Z␊
     */␊
    ␊
    import { FooType } from "../json-types.js";␊
    ␊
    /** @table foo.bar */␊
    export interface Bar {␊
      /**␊
       * @column bar_text␊
       * @pgType text␊
       */␊
      bar_text: string;␊
    ␊
      /**␊
       * @column bar_jsonb␊
       * @pgType jsonb␊
       */␊
      bar_jsonb: FooType;␊
    }␊
    `

> generated/json-types.ts

    `/**␊
     * @note This file was generated with \`ts-pg-model\`.␊
     * @generated 2000-01-01T00:00:00.000Z␊
     */␊
    ␊
    export type FooType = {␊
      foo: string;␊
      bar: number;␊
      baz: {␊
        foobar: number;␊
        barbaz: string;␊
      };␊
    };␊
    `
