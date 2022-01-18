import { readFileSync } from 'fs';
import { IndentationText, Project, SourceFile } from 'ts-morph';
import { URL } from 'url';

export class TsMorphHelper {
  project: Project;

  sourceFile: SourceFile;

  prevSource: string | undefined;

  constructor(tsPath: string, source?: string) {
    this.project = new Project({
      tsConfigFilePath: new URL('../../../tsconfig.json', import.meta.url).pathname,
      skipAddingFilesFromTsConfig: true,
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        useTrailingCommas: true,
      },
    });

    try {
      this.prevSource = readFileSync(tsPath, { encoding: 'utf-8' });
    } catch (error) {
      //
    }

    this.sourceFile = this.project.createSourceFile(tsPath, source, {
      overwrite: true,
    });
  }

  async save() {
    this.sourceFile.insertStatements(
      0,
      [
        `/**`,
        ` * @note This file was generated with \`ts-pg-model\`.`,
        ` * @generated ${new Date().toJSON()}`,
        ` */`,
        '',
        '',
      ].join('\n'),
    );

    this.sourceFile.formatText();

    const normalizeGeneratedDate = (source: string) =>
      source.replace(
        / \* @generated \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
        ' * @generated GENERATED_DATE',
      );

    if (this.prevSource) {
      const curSourceNormalized = normalizeGeneratedDate(this.sourceFile.getFullText());
      const prevSourceNormalized = normalizeGeneratedDate(this.prevSource);
      if (curSourceNormalized !== prevSourceNormalized) await this.project.save();
    } else {
      await this.project.save();
    }
  }
}
