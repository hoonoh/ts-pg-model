import { IndentationText, Project, SourceFile } from 'ts-morph';
import { URL } from 'url';

export const insertGeneratedComment = (sourceFile: SourceFile) => {
  sourceFile.insertStatements(
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
};

export const startProject = (tsPath: string, source?: string) => {
  const project = new Project({
    tsConfigFilePath: new URL('../../../tsconfig.json', import.meta.url).pathname,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
    },
  });

  const sourceFile = project.createSourceFile(tsPath, source, {
    overwrite: true,
  });

  return { project, sourceFile };
};

export const saveProject = async ({
  project,
  sourceFile,
  skipInsertGeneratedComment,
}: {
  project: Project;
  sourceFile: SourceFile;
  skipInsertGeneratedComment?: boolean;
}) => {
  if (skipInsertGeneratedComment !== true) insertGeneratedComment(sourceFile);
  sourceFile.formatText();
  await project.save();
};
