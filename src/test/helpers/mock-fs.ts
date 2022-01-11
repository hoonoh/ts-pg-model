import mockFs from 'mock-fs';
import { resolve } from 'path';
import { cwd } from 'process';
import { URL } from 'url';

export class MockFs {
  private static default = {
    node_modules: mockFs.load(new URL('../../../node_modules', import.meta.url).pathname, {
      recursive: true,
    }),
    [resolve(cwd(), 'tsconfig.json')]: mockFs.load(resolve(cwd(), 'tsconfig.json'), {
      recursive: true,
    }),
  };

  static mockString(def: Record<string, string>) {
    mockFs({
      ...MockFs.default,
      ...def,
    });
  }

  static mockDirectory(path: string) {
    mockFs({
      ...MockFs.default,
      [path]: {},
    });
  }

  static restore() {
    mockFs.restore();
  }
}
