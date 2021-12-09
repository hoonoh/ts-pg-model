import mockFs from 'mock-fs';
import { resolve } from 'path';

export class MockFs {
  static mockString(def: Record<string, string>) {
    mockFs({
      node_modules: mockFs.load(resolve(__dirname, '../../node_modules'), { recursive: true }),
      ...def,
    });
  }

  static restore() {
    mockFs.restore();
  }
}
