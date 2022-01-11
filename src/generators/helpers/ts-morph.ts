import { resolve } from 'path';
import { IndentationText, Project, SourceFile } from 'ts-morph';

export const insertGeneratedComment = (sourceFile: SourceFile) => {
  sourceFile.insertStatements(
    0,
    [
      `/**`,
      `* @note This file was generated with \`ts-pg-model\`.`,
      `* @generated ${new Date().toJSON()}`,
      `*/`,
    ].join('\n'),
  );
};

export const startProject = (tsPath: string, source?: string) => {
  const project = new Project({
    tsConfigFilePath: resolve(__dirname, '../../../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
    },
  });

  const sourceFile = project.createSourceFile(tsPath, source, {
    overwrite: true,
  });

  insertGeneratedComment(sourceFile);

  return { project, sourceFile };
};
