import { resolve } from 'path';
import { IndentationText, Project, SourceFile } from 'ts-morph';

export const insertGeneratedComment = (sourceFile: SourceFile, index = 0) => {
  sourceFile.insertStatements(
    index,
    `/**
* @note This file was generated with \`ts-pg-model\`.
* @generated ${new Date().toJSON()}
*/`,
  );
};

export const startProject = (tsPath: string, insertGeneratedCommentAt = 0) => {
  const project = new Project({
    tsConfigFilePath: resolve(__dirname, '../../../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
    },
  });

  const sourceFile = project.createSourceFile(tsPath, undefined, {
    overwrite: true,
  });

  insertGeneratedComment(sourceFile, insertGeneratedCommentAt);

  return { project, sourceFile };
};
