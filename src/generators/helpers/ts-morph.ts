import { readFileSync } from 'fs';
import { IndentationText, Project, SourceFile } from 'ts-morph';
import { URL } from 'url';

export class TsMorphHelper {
  project: Project;

  sourceFile: SourceFile;

  prevSource: string | undefined;

  constructor(public sourcePath: string, source?: string) {
    this.project = new Project({
      // todo: tsconfig path should be relative from cwd
      // todo: requires tsconfig path config
      tsConfigFilePath: new URL('../../../tsconfig.json', import.meta.url).pathname,
      skipAddingFilesFromTsConfig: true,
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        useTrailingCommas: true,
      },
    });

    try {
      this.prevSource = readFileSync(sourcePath, { encoding: 'utf-8' });
    } catch (error) {
      //
    }

    this.sourceFile = this.project.createSourceFile(sourcePath, source, {
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

    // only save if previous source is not available
    // OR output source is updated excluding generated date.
    if (
      !this.prevSource ||
      (this.prevSource &&
        normalizeGeneratedDate(this.sourceFile.getFullText()) !==
          normalizeGeneratedDate(this.prevSource))
    ) {
      await this.project.save();
    }
  }
}
