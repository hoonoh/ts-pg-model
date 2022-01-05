/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addExtension('uuid-ossp', { ifNotExists: true });

  // public
  pgm.createType(
    { schema: 'public', name: 'domain' },
    {
      host: 'text',
      version: 'int2',
    },
  );

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
  pgm.createType(
    { schema: 'users', name: 'user_agent_version' },
    {
      family: 'text',
      major: 'int2',
      minor: 'int2',
      patch: 'int2',
    },
  );
  pgm.createType(
    { schema: 'users', name: 'user_agent' },
    {
      source: 'text',
      browser: 'users.user_agent_browser',
      agent: 'users.user_agent_version',
      device: 'users.user_agent_version',
      operating_system: 'users.user_agent_version',
    },
  );
  pgm.createTable(
    { schema: 'users', name: 'sessions' },
    {
      domain: { type: 'public.domain', notNull: true },
      user_id: { references: { schema: 'users', name: 'users' }, type: 'int' },
      token: { type: 'text', notNull: true },
      ip: { type: 'inet', notNull: true },
      user_agent: { type: 'users.user_agent', notNull: true },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    },
  );
  pgm.addIndex({ schema: 'users', name: 'sessions' }, 'user_id');
  pgm.addIndex({ schema: 'users', name: 'sessions' }, 'token');

  // media
  pgm.createSchema('media');

  pgm.createType({ schema: 'media', name: 'image_type' }, ['jpg', 'gif', 'webp']);

  pgm.createType({ schema: 'media', name: 'dimension' }, { width: 'int', height: 'int' });

  pgm.createTable(
    { schema: 'media', name: 'images' },
    {
      domain: { type: 'public.domain', notNull: true },
      id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
      type: { type: 'media.image_type', notNull: true },
      filename: { type: 'text', notNull: true },
      filesize: { type: 'int', notNull: true },
      dimension: { type: 'media.dimension', notNull: true },
      owner: { type: 'serial', references: { schema: 'users', name: 'users' } },
      metadata: { type: 'jsonb' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    },
  );
  pgm.addIndex({ schema: 'media', name: 'images' }, 'filename');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable({ schema: 'media', name: 'images' });
  pgm.dropType({ schema: 'media', name: 'image_type' });
  pgm.dropType({ schema: 'media', name: 'dimension' });
  pgm.dropSchema('media');

  pgm.dropTable({ schema: 'users', name: 'sessions' });
  pgm.dropType({ schema: 'users', name: 'user_agent' });
  pgm.dropType({ schema: 'users', name: 'user_agent_browser' });
  pgm.dropType({ schema: 'users', name: 'user_agent_version' });
  pgm.dropTable({ schema: 'users', name: 'users' });
  pgm.dropSchema('users');

  pgm.dropType({ schema: 'public', name: 'domain' });
}
