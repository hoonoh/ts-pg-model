import { readFile } from 'fs/promises';
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

export const startProject = async (tsPath: string, source?: string) => {
  const project = new Project({
    tsConfigFilePath: new URL('../../../tsconfig.json', import.meta.url).pathname,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      useTrailingCommas: true,
    },
  });

  let prevSource: string | undefined;
  try {
    prevSource = await readFile(tsPath, { encoding: 'utf-8' });
  } catch (error) {
    //
  }

  const sourceFile = project.createSourceFile(tsPath, source, {
    overwrite: true,
  });

  return { project, sourceFile, prevSource };
};

export const saveProject = async ({
  project,
  sourceFile,
  prevSource,
  skipInsertGeneratedComment,
}: {
  project: Project;
  sourceFile: SourceFile;
  prevSource?: string;
  skipInsertGeneratedComment?: boolean;
}) => {
  if (skipInsertGeneratedComment !== true) insertGeneratedComment(sourceFile);
  sourceFile.formatText();

  const normalizeGeneratedDate = (source: string) =>
    source.replace(
      / \* @generated \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
      ' * @generated GENERATED_DATE',
    );

  if (prevSource) {
    const curSourceNormalized = normalizeGeneratedDate(sourceFile.getFullText());
    const prevSourceNormalized = normalizeGeneratedDate(prevSource);
    if (curSourceNormalized !== prevSourceNormalized) await project.save();
  } else {
    await project.save();
  }
};
