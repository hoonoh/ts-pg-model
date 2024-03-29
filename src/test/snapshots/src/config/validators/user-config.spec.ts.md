# Snapshot report for `src/config/validators/user-config.spec.ts`

The actual snapshot is saved in `user-config.spec.ts.snap`.

Generated by [AVA](https://avajs.dev).

## 🧪 [snapshot] › should validate `UserConfig` and return expected `Config`

> Snapshot 1

    {
      compositeTypes: {
        media: {
          dimension: {
            attributes: {
              height: 'number',
              width: 'number',
            },
            name: 'dimension',
            schema: 'media',
          },
        },
        public: {
          domain: {
            attributes: {
              host: 'string',
              version: 'number',
            },
            name: 'domain',
            schema: 'public',
          },
        },
        users: {
          user_agent: {
            attributes: {
              agent: {
                attributes: {
                  family: 'string',
                  major: 'number',
                  minor: 'number',
                  patch: 'number',
                },
                name: 'user_agent_version',
                schema: 'users',
              },
              browser: {
                labels: [
                  'chrome',
                  'firefox',
                  'ie',
                  'mobile_safari',
                  'mozilla',
                  'opera',
                  'safari',
                  'webkit',
                  'android',
                  'version',
                ],
                name: 'user_agent_browser',
                schema: 'users',
              },
              device: {
                attributes: {
                  family: 'string',
                  major: 'number',
                  minor: 'number',
                  patch: 'number',
                },
                name: 'user_agent_version',
                schema: 'users',
              },
              operating_system: {
                attributes: {
                  family: 'string',
                  major: 'number',
                  minor: 'number',
                  patch: 'number',
                },
                name: 'user_agent_version',
                schema: 'users',
              },
              source: 'string',
            },
            name: 'user_agent',
            schema: 'users',
          },
          user_agent_version: {
            attributes: {
              family: 'string',
              major: 'number',
              minor: 'number',
              patch: 'number',
            },
            name: 'user_agent_version',
            schema: 'users',
          },
        },
      },
      connectionURI: 'postgresql://postgres:secretpassword@localhost:54321/postgres',
      conventions: {
        columns: Function keep {},
        paths: Function kebabCase {},
        schemas: Function camelCase {},
        types: Function camelCase {},
      },
      enumTypes: {
        media: {
          image_type: {
            labels: [
              'jpg',
              'gif',
              'webp',
            ],
            name: 'image_type',
            schema: 'media',
          },
        },
        users: {
          user_agent_browser: {
            labels: [
              'chrome',
              'firefox',
              'ie',
              'mobile_safari',
              'mozilla',
              'opera',
              'safari',
              'webkit',
              'android',
              'version',
            ],
            name: 'user_agent_browser',
            schema: 'users',
          },
        },
      },
      ignoreCompositeTypeColumns: false,
      importSuffix: '.js',
      output: {
        existingFilePaths: [],
        includeSchemaPath: false,
        keepFiles: [],
        root: '/generated',
      },
      renderTargets: {
        media: {
          images: {
            columns: {
              dimension: {
                columnName: 'dimension',
                comment: undefined,
                dataType: 'USER-DEFINED',
                defaults: undefined,
                isNullable: false,
                schema: 'media',
                tableName: 'images',
                type: {
                  composite: {
                    attributes: {
                      height: 'number',
                      width: 'number',
                    },
                    name: 'dimension',
                    schema: 'media',
                  },
                },
                udtName: 'dimension',
                userDefinedUdtSchema: 'media',
              },
              domain: {
                columnName: 'domain',
                comment: undefined,
                dataType: 'USER-DEFINED',
                defaults: undefined,
                isNullable: false,
                schema: 'media',
                tableName: 'images',
                type: {
                  composite: {
                    attributes: {
                      host: 'string',
                      version: 'number',
                    },
                    name: 'domain',
                    schema: 'public',
                  },
                },
                udtName: 'domain',
                userDefinedUdtSchema: 'public',
              },
              filename: {
                columnName: 'filename',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: false,
                schema: 'media',
                tableName: 'images',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              filesize: {
                columnName: 'filesize',
                comment: undefined,
                dataType: 'integer',
                defaults: undefined,
                isNullable: false,
                schema: 'media',
                tableName: 'images',
                type: {
                  ts: 'number',
                },
                udtName: 'int4',
                userDefinedUdtSchema: null,
              },
              id: {
                columnName: 'id',
                comment: undefined,
                dataType: 'uuid',
                defaults: undefined,
                isNullable: false,
                schema: 'media',
                tableName: 'images',
                type: {
                  ts: 'string',
                },
                udtName: 'uuid',
                userDefinedUdtSchema: null,
              },
              metadata: {
                columnName: 'metadata',
                comment: undefined,
                dataType: 'jsonb',
                defaults: undefined,
                isNullable: true,
                schema: 'media',
                tableName: 'images',
                type: {
                  json: {
                    columnName: 'metadata',
                    name: 'ImageMetadata',
                    schema: 'media',
                    tableName: 'images',
                  },
                },
                udtName: 'jsonb',
                userDefinedUdtSchema: null,
              },
              owner: {
                columnName: 'owner',
                comment: undefined,
                dataType: 'integer',
                defaults: undefined,
                isNullable: false,
                schema: 'media',
                tableName: 'images',
                type: {
                  ts: 'number',
                },
                udtName: 'int4',
                userDefinedUdtSchema: null,
              },
              type: {
                columnName: 'type',
                comment: undefined,
                dataType: 'USER-DEFINED',
                defaults: undefined,
                isNullable: false,
                schema: 'media',
                tableName: 'images',
                type: {
                  enum: {
                    labels: [
                      'jpg',
                      'gif',
                      'webp',
                    ],
                    name: 'image_type',
                    schema: 'media',
                  },
                },
                udtName: 'image_type',
                userDefinedUdtSchema: 'media',
              },
            },
            comment: undefined,
            constraints: [
              {
                columnNames: [
                  'owner',
                ],
                definition: 'FOREIGN KEY (owner) REFERENCES users.users(id)',
                docs: '@foreignKey images_owner_fkey (users.users(id))',
                name: 'images_owner_fkey',
                schema: 'media',
                tableName: 'images',
                type: 'ForeignKey',
              },
              {
                columnNames: [
                  'id',
                ],
                definition: 'PRIMARY KEY (id)',
                docs: '@primaryKey images_pkey (id)',
                name: 'images_pkey',
                schema: 'media',
                tableName: 'images',
                type: 'PrimaryKey',
              },
            ],
            indexes: [
              {
                columnNames: [
                  'filename',
                ],
                definition: 'CREATE INDEX images_filename_index ON media.images USING btree (filename)',
                docs: '@index `btree` images_filename_index (filename)',
                isUnique: false,
                name: 'images_filename_index',
                schema: 'media',
                tableName: 'images',
                using: 'btree',
              },
              {
                columnNames: [
                  'id',
                ],
                definition: 'CREATE UNIQUE INDEX images_pkey ON media.images USING btree (id)',
                docs: '@index `btree` images_pkey (id)',
                isUnique: true,
                name: 'images_pkey',
                schema: 'media',
                tableName: 'images',
                using: 'btree',
              },
            ],
            schema: 'media',
            tableName: 'images',
          },
        },
        users: {
          constraints_test: {
            columns: {
              alias: {
                columnName: 'alias',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'constraints_test',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              email: {
                columnName: 'email',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'constraints_test',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              id1: {
                columnName: 'id1',
                comment: 'id1 column comment',
                dataType: 'text',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'constraints_test',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              id2: {
                columnName: 'id2',
                comment: 'id2 column comment',
                dataType: 'text',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'constraints_test',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              name_first: {
                columnName: 'name_first',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'constraints_test',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              name_last: {
                columnName: 'name_last',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'constraints_test',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              note: {
                columnName: 'note',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'constraints_test',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
            },
            comment: 'constraints_test table comment',
            constraints: [
              {
                columnNames: [
                  'name_first',
                  'name_last',
                  'email',
                  'note',
                ],
                definition: 'CHECK ((((name_first IS NOT NULL) AND ((name_last IS NOT NULL) OR (email IS NOT NULL))) OR (NOT (note IS NULL))))',
                docs: '@check constraints_test_ch (((((name_first IS NOT NULL) AND ((name_last IS NOT NULL) OR (email IS NOT NULL))) OR (NOT (note IS NULL)))))',
                name: 'constraints_test_ch',
                schema: 'users',
                tableName: 'constraints_test',
                type: 'Check',
              },
              {
                columnNames: [
                  'name_first',
                  'name_last',
                ],
                definition: 'FOREIGN KEY (name_first, name_last) REFERENCES users.users(name_first, name_last)',
                docs: '@foreignKey constraints_test_fk ((name_first, name_last)->users.users(name_first, name_last))',
                name: 'constraints_test_fk',
                schema: 'users',
                tableName: 'constraints_test',
                type: 'ForeignKey',
              },
              {
                columnNames: [
                  'id1',
                  'id2',
                ],
                definition: 'PRIMARY KEY (id1, id2)',
                docs: '@primaryKey constraints_test_pk (id1, id2)',
                name: 'constraints_test_pk',
                schema: 'users',
                tableName: 'constraints_test',
                type: 'PrimaryKey',
              },
              {
                columnNames: [
                  'alias',
                  'email',
                ],
                definition: 'UNIQUE (alias, email)',
                docs: '@unique constraints_test_uq (alias, email)',
                name: 'constraints_test_uq',
                schema: 'users',
                tableName: 'constraints_test',
                type: 'Unique',
              },
              {
                columnNames: [
                  'alias',
                  'email',
                ],
                definition: 'EXCLUDE USING gist (alias WITH =, email WITH <>)',
                docs: '@exclude constraints_test_ex (gist (alias WITH =, email WITH <>))',
                name: 'constraints_test_ex',
                schema: 'users',
                tableName: 'constraints_test',
                type: 'Exclude',
              },
            ],
            indexes: [
              {
                columnNames: [
                  'alias',
                  'email',
                ],
                definition: 'CREATE INDEX constraints_test_ex ON users.constraints_test USING gist (alias, email)',
                docs: '@index `gist` constraints_test_ex (alias, email)',
                isUnique: false,
                name: 'constraints_test_ex',
                schema: 'users',
                tableName: 'constraints_test',
                using: 'gist',
              },
              {
                columnNames: [
                  'id1',
                  'id2',
                ],
                definition: 'CREATE UNIQUE INDEX constraints_test_pk ON users.constraints_test USING btree (id1, id2)',
                docs: '@index `btree` constraints_test_pk (id1, id2)',
                isUnique: true,
                name: 'constraints_test_pk',
                schema: 'users',
                tableName: 'constraints_test',
                using: 'btree',
              },
              {
                columnNames: [
                  'alias',
                  'email',
                ],
                definition: 'CREATE UNIQUE INDEX constraints_test_uq ON users.constraints_test USING btree (alias, email)',
                docs: '@index `btree` constraints_test_uq (alias, email)',
                isUnique: true,
                name: 'constraints_test_uq',
                schema: 'users',
                tableName: 'constraints_test',
                using: 'btree',
              },
            ],
            schema: 'users',
            tableName: 'constraints_test',
          },
          sessions: {
            columns: {
              created_at: {
                columnName: 'created_at',
                comment: undefined,
                dataType: 'timestamp with time zone',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'sessions',
                type: {
                  ts: 'Timestamp',
                },
                udtName: 'timestamptz',
                userDefinedUdtSchema: null,
              },
              domain: {
                columnName: 'domain',
                comment: undefined,
                dataType: 'USER-DEFINED',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'sessions',
                type: {
                  composite: {
                    attributes: {
                      host: 'string',
                      version: 'number',
                    },
                    name: 'domain',
                    schema: 'public',
                  },
                },
                udtName: 'domain',
                userDefinedUdtSchema: 'public',
              },
              ip: {
                columnName: 'ip',
                comment: undefined,
                dataType: 'inet',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'sessions',
                type: {
                  ts: 'string',
                },
                udtName: 'inet',
                userDefinedUdtSchema: null,
              },
              token: {
                columnName: 'token',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'sessions',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              updated_at: {
                columnName: 'updated_at',
                comment: undefined,
                dataType: 'timestamp with time zone',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'sessions',
                type: {
                  ts: 'Timestamp',
                },
                udtName: 'timestamptz',
                userDefinedUdtSchema: null,
              },
              user_agent: {
                columnName: 'user_agent',
                comment: undefined,
                dataType: 'USER-DEFINED',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'sessions',
                type: {
                  composite: {
                    attributes: {
                      agent: {
                        attributes: {
                          family: 'string',
                          major: 'number',
                          minor: 'number',
                          patch: 'number',
                        },
                        name: 'user_agent_version',
                        schema: 'users',
                      },
                      browser: {
                        labels: [
                          'chrome',
                          'firefox',
                          'ie',
                          'mobile_safari',
                          'mozilla',
                          'opera',
                          'safari',
                          'webkit',
                          'android',
                          'version',
                        ],
                        name: 'user_agent_browser',
                        schema: 'users',
                      },
                      device: {
                        attributes: {
                          family: 'string',
                          major: 'number',
                          minor: 'number',
                          patch: 'number',
                        },
                        name: 'user_agent_version',
                        schema: 'users',
                      },
                      operating_system: {
                        attributes: {
                          family: 'string',
                          major: 'number',
                          minor: 'number',
                          patch: 'number',
                        },
                        name: 'user_agent_version',
                        schema: 'users',
                      },
                      source: 'string',
                    },
                    name: 'user_agent',
                    schema: 'users',
                  },
                },
                udtName: 'user_agent',
                userDefinedUdtSchema: 'users',
              },
              user_id: {
                columnName: 'user_id',
                comment: undefined,
                dataType: 'integer',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'sessions',
                type: {
                  ts: 'number',
                },
                udtName: 'int4',
                userDefinedUdtSchema: null,
              },
            },
            comment: undefined,
            constraints: [
              {
                columnNames: [
                  'user_id',
                ],
                definition: 'FOREIGN KEY (user_id) REFERENCES users.users(id)',
                docs: '@foreignKey sessions_user_id_fkey (users.users(id))',
                name: 'sessions_user_id_fkey',
                schema: 'users',
                tableName: 'sessions',
                type: 'ForeignKey',
              },
            ],
            indexes: [
              {
                columnNames: [
                  'token',
                ],
                definition: 'CREATE INDEX sessions_token_index ON users.sessions USING btree (token)',
                docs: '@index `btree` sessions_token_index (token)',
                isUnique: false,
                name: 'sessions_token_index',
                schema: 'users',
                tableName: 'sessions',
                using: 'btree',
              },
              {
                columnNames: [
                  'user_id',
                ],
                definition: 'CREATE INDEX sessions_user_id_index ON users.sessions USING btree (user_id)',
                docs: '@index `btree` sessions_user_id_index (user_id)',
                isUnique: false,
                name: 'sessions_user_id_index',
                schema: 'users',
                tableName: 'sessions',
                using: 'btree',
              },
            ],
            schema: 'users',
            tableName: 'sessions',
          },
          users: {
            columns: {
              alias: {
                columnName: 'alias',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'users',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              email: {
                columnName: 'email',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'users',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              id: {
                columnName: 'id',
                comment: undefined,
                dataType: 'integer',
                defaults: undefined,
                isNullable: false,
                schema: 'users',
                tableName: 'users',
                type: {
                  ts: 'number',
                },
                udtName: 'int4',
                userDefinedUdtSchema: null,
              },
              name_first: {
                columnName: 'name_first',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'users',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
              name_last: {
                columnName: 'name_last',
                comment: undefined,
                dataType: 'text',
                defaults: undefined,
                isNullable: true,
                schema: 'users',
                tableName: 'users',
                type: {
                  ts: 'string',
                },
                udtName: 'text',
                userDefinedUdtSchema: null,
              },
            },
            comment: undefined,
            constraints: [
              {
                columnNames: [
                  'id',
                ],
                definition: 'PRIMARY KEY (id)',
                docs: '@primaryKey users_pkey (id)',
                name: 'users_pkey',
                schema: 'users',
                tableName: 'users',
                type: 'PrimaryKey',
              },
              {
                columnNames: [
                  'name_first',
                  'name_last',
                ],
                definition: 'UNIQUE (name_first, name_last)',
                docs: '@unique name_unique (name_first, name_last)',
                name: 'name_unique',
                schema: 'users',
                tableName: 'users',
                type: 'Unique',
              },
              {
                columnNames: [
                  'alias',
                ],
                definition: 'UNIQUE (alias)',
                docs: '@unique users_alias_key (alias)',
                name: 'users_alias_key',
                schema: 'users',
                tableName: 'users',
                type: 'Unique',
              },
              {
                columnNames: [
                  'email',
                ],
                definition: 'UNIQUE (email)',
                docs: '@unique users_email_key (email)',
                name: 'users_email_key',
                schema: 'users',
                tableName: 'users',
                type: 'Unique',
              },
            ],
            indexes: [
              {
                columnNames: [
                  'name_first',
                  'name_last',
                ],
                definition: 'CREATE UNIQUE INDEX name_unique ON users.users USING btree (name_first, name_last)',
                docs: '@index `btree` name_unique (name_first, name_last)',
                isUnique: true,
                name: 'name_unique',
                schema: 'users',
                tableName: 'users',
                using: 'btree',
              },
              {
                columnNames: [
                  'alias',
                ],
                definition: 'CREATE INDEX users_alias_index ON users.users USING btree (alias)',
                docs: '@index `btree` users_alias_index (alias)',
                isUnique: false,
                name: 'users_alias_index',
                schema: 'users',
                tableName: 'users',
                using: 'btree',
              },
              {
                columnNames: [
                  'alias',
                ],
                definition: 'CREATE UNIQUE INDEX users_alias_key ON users.users USING btree (alias)',
                docs: '@index `btree` users_alias_key (alias)',
                isUnique: true,
                name: 'users_alias_key',
                schema: 'users',
                tableName: 'users',
                using: 'btree',
              },
              {
                columnNames: [
                  'email',
                ],
                definition: 'CREATE INDEX users_email_index ON users.users USING btree (email)',
                docs: '@index `btree` users_email_index (email)',
                isUnique: false,
                name: 'users_email_index',
                schema: 'users',
                tableName: 'users',
                using: 'btree',
              },
              {
                columnNames: [
                  'email',
                ],
                definition: 'CREATE UNIQUE INDEX users_email_key ON users.users USING btree (email)',
                docs: '@index `btree` users_email_key (email)',
                isUnique: true,
                name: 'users_email_key',
                schema: 'users',
                tableName: 'users',
                using: 'btree',
              },
              {
                columnNames: [
                  'id',
                ],
                definition: 'CREATE UNIQUE INDEX users_pkey ON users.users USING btree (id)',
                docs: '@index `btree` users_pkey (id)',
                isUnique: true,
                name: 'users_pkey',
                schema: 'users',
                tableName: 'users',
                using: 'btree',
              },
            ],
            schema: 'users',
            tableName: 'users',
          },
        },
      },
      schemas: [
        'users',
        'media',
      ],
      tsConfig: '/tsconfig.json',
      typeMap: {
        json: [
          {
            columnName: 'metadata',
            name: 'ImageMetadata',
            schema: 'media',
            tableName: 'images',
          },
        ],
      },
    }
