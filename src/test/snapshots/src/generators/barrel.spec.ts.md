# Snapshot report for `src/generators/barrel.spec.ts`

The actual snapshot is saved in `barrel.spec.ts.snap`.

Generated by [AVA](https://avajs.dev).

## ๐งช should barrel files in multi schema mode

> media - /test/generated/media/index.ts

    `/**โ
     * @note This file was generated with \`ts-pg-model\`.โ
     * @generated 2000-01-01T00:00:00.000Zโ
     */โ
    โ
    import { ImageType as _ImageType } from "./enum-types";โ
    import { Dimension as _Dimension } from "./composite-types";โ
    import * as _Images from "./images";โ
    โ
    /** @schema: media */โ
    export namespace media {โ
      export import ImageType = _ImageType;โ
      export type Dimension = _Dimension;โ
      export import Images = _Images;โ
    }โ
    `

> public - /test/generated/public/index.ts

    `/**โ
     * @note This file was generated with \`ts-pg-model\`.โ
     * @generated 2000-01-01T00:00:00.000Zโ
     */โ
    โ
    import "./enum-types";โ
    import { Domain as _Domain } from "./composite-types";โ
    โ
    /** @schema: public */โ
    export namespace pgPublic {โ
      export type Domain = _Domain;โ
    }โ
    `

> users - /test/generated/users/index.ts

    `/**โ
     * @note This file was generated with \`ts-pg-model\`.โ
     * @generated 2000-01-01T00:00:00.000Zโ
     */โ
    โ
    import { UserAgentBrowser as _UserAgentBrowser } from "./enum-types";โ
    import { UserAgent as _UserAgent, UserAgentVersion as _UserAgentVersion } from "./composite-types";โ
    import * as _ConstraintsTest from "./constraints-test";โ
    import * as _Sessions from "./sessions";โ
    import * as _Users from "./users";โ
    โ
    /** @schema: users */โ
    export namespace users {โ
      export import UserAgentBrowser = _UserAgentBrowser;โ
      export type UserAgent = _UserAgent;โ
      export type UserAgentVersion = _UserAgentVersion;โ
      export import ConstraintsTest = _ConstraintsTest;โ
      export import Sessions = _Sessions;โ
      export import Users = _Users;โ
    }โ
    `
