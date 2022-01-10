# Snapshot report for `src/generators/table.spec.ts`

The actual snapshot is saved in `table.spec.ts.snap`.

Generated by [AVA](https://avajs.dev).

## 🧪 should render tables

> foo_bar.foo_bar_baz table output

    `/**␊
    * @note This file was generated with \`ts-pg-model\`.␊
    * @generated 2000-01-01T00:00:00.000Z␊
    */␊
    import { BarBaz } from "./enum-types.ts";␊
    ␊
    /**␊
     * @table foo_bar.foo_bar_baz␊
     * @schema foo_bar␊
     * @name foo_bar_baz␊
     */␊
    export interface FooBarBaz {␊
      /**␊
       * @column foo_bar.foo_bar_baz.baz_qux␊
       * @name baz_qux␊
       * @pgtype text␊
       * @nullable␊
       * @comment 'baz_qux comment'␊
       * @primaryKey baz_qux_pkey (baz_qux)␊
       * @unique baz_qux_unique (baz_qux)␊
       * @check baz_qux_check ((baz_qux IS NOT NULL))␊
       * @exclude baz_qux_exclude (gist (baz_qux WITH =))␊
       */␊
      bazQux?: string | null;␊
      /**␊
       * @column foo_bar.foo_bar_baz.fkey_col␊
       * @name fkey_col␊
       * @pgtype text␊
       * @foreignKey fkey_col_fkey (bar.baz (qux))␊
       */␊
      fkeyCol: string;␊
      /**␊
       * @column foo_bar.foo_bar_baz.enum_bar_baz␊
       * @name enum_bar_baz␊
       * @pgtype [enum] foo_bar.bar_baz␊
       * @default 'bar_baz_label1'␊
       * @comment 'enum_bar_baz comment'␊
       */␊
      enumBarBaz: BarBaz;␊
    }␊
    `

> bar.baz table output

    `/**␊
    * @note This file was generated with \`ts-pg-model\`.␊
    * @generated 2000-01-01T00:00:00.000Z␊
    */␊
    import { BazQux } from "./enum-types.ts";␊
    ␊
    /**␊
     * @table bar.baz␊
     * @schema bar␊
     * @name baz␊
     */␊
    export interface Baz {␊
      /**␊
       * @column bar.baz.qux␊
       * @name qux␊
       * @pgtype text␊
       */␊
      qux: string;␊
      /**␊
       * @column bar.baz.enum_baz_qux␊
       * @name enum_baz_qux␊
       * @pgtype [enum] bar.baz_qux␊
       */␊
      enumBazQux: BazQux;␊
    }␊
    `