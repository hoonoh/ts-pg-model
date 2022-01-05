/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addExtension('uuid-ossp', { ifNotExists: true });

  // users
  pgm.createSchema('users');

  pgm.createTable(
    { schema: 'users', name: 'users' },
    {
      id: { type: 'serial', notNull: true, primaryKey: true },
      alias: { type: 'text', notNull: true },
      email: { type: 'text', notNull: true },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    },
  );
  pgm.addIndex({ schema: 'users', name: 'users' }, 'alias');
  pgm.addIndex({ schema: 'users', name: 'users' }, 'email');

  pgm.createType({ schema: 'users', name: 'user_agent_browser' }, [
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
  ]);
  pgm.createTable(
    { schema: 'users', name: 'sessions' },
    {
      user_id: { references: { schema: 'users', name: 'users' }, type: 'int' },
      token: { type: 'text', notNull: true },
      ip: { type: 'inet', notNull: true },
      user_agent: { type: 'text', notNull: true },
      browser: { type: 'users.user_agent_browser', notNull: true },
      device: { type: 'text', notNull: true },
      operating_system: { type: 'text', notNull: true },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    },
  );
  pgm.addIndex({ schema: 'users', name: 'sessions' }, 'user_id');
  pgm.addIndex({ schema: 'users', name: 'sessions' }, 'token');

  // media
  pgm.createSchema('media');

  pgm.createType({ schema: 'media', name: 'image_type' }, ['jpg', 'gif', 'webp']);

  pgm.createTable(
    { schema: 'media', name: 'images' },
    {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
      type: { type: 'media.image_type', notNull: true },
      filename: { type: 'text', notNull: true },
      filesize: { type: 'int', notNull: true },
      width: { type: 'int2', notNull: true },
      height: { type: 'int2', notNull: true },
      owner: { type: 'serial', references: { schema: 'users', name: 'users' } },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    },
  );
  pgm.addIndex({ schema: 'media', name: 'images' }, 'filename');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable({ schema: 'media', name: 'images' });
  pgm.dropType({ schema: 'media', name: 'image_type' });
  pgm.dropSchema('media');

  pgm.dropTable({ schema: 'users', name: 'sessions' });
  pgm.dropType({ schema: 'users', name: 'user_agent_browser' });
  pgm.dropTable({ schema: 'users', name: 'users' });
  pgm.dropSchema('users');
}
