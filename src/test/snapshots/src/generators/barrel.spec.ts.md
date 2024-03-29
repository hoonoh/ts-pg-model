# Snapshot report for `src/generators/barrel.spec.ts`

The actual snapshot is saved in `barrel.spec.ts.snap`.

Generated by [AVA](https://avajs.dev).

## 🧪 should barrel files in multi schema mode

> media - /test/generated/media/index.ts

    `/**␊
     * @note This file was generated with \`ts-pg-model\`.␊
     * @generated 2000-01-01T00:00:00.000Z␊
     */␊
    ␊
    import { ImageType as _ImageType } from "./enum-types";␊
    import { Dimension as _Dimension } from "./composite-types";␊
    import * as _Images from "./images";␊
    ␊
    /** @schema: media */␊
    export namespace media {␊
      export import ImageType = _ImageType;␊
      export type Dimension = _Dimension;␊
      export import Images = _Images;␊
    }␊
    `

> public - /test/generated/public/index.ts

    `/**␊
     * @note This file was generated with \`ts-pg-model\`.␊
     * @generated 2000-01-01T00:00:00.000Z␊
     */␊
    ␊
    import "./enum-types";␊
    import { Domain as _Domain } from "./composite-types";␊
    ␊
    /** @schema: public */␊
    export namespace pgPublic {␊
      export type Domain = _Domain;␊
    }␊
    `

> users - /test/generated/users/index.ts

    `/**␊
     * @note This file was generated with \`ts-pg-model\`.␊
     * @generated 2000-01-01T00:00:00.000Z␊
     */␊
    ␊
    import { UserAgentBrowser as _UserAgentBrowser } from "./enum-types";␊
    import { UserAgent as _UserAgent, UserAgentVersion as _UserAgentVersion } from "./composite-types";␊
    import * as _ConstraintsTest from "./constraints-test";␊
    import * as _Sessions from "./sessions";␊
    import * as _Users from "./users";␊
    ␊
    /** @schema: users */␊
    export namespace users {␊
      export import UserAgentBrowser = _UserAgentBrowser;␊
      export type UserAgent = _UserAgent;␊
      export type UserAgentVersion = _UserAgentVersion;␊
      export import ConstraintsTest = _ConstraintsTest;␊
      export import Sessions = _Sessions;␊
      export import Users = _Users;␊
    }␊
    `
