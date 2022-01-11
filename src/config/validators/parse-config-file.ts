import assert from 'assert';
import { trim } from 'lodash-es';
import { EOL } from 'os';
import { Node, Project, Symbol } from 'ts-morph';

import { JsonTypeBareDefinitions } from './../types/config.js';

export const parseConfigFile = (sourceFilePath: string) => {
  const jsonTypeMaps: JsonTypeBareDefinitions = [];

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(sourceFilePath);

  const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
  const namedExport = sourceFile.getExportedDeclarations().get('userConfig')?.pop();

  // eslint-disable-next-line @typescript-eslint/ban-types
  const parseUserConfig = (userConfig?: Symbol) => {
    const jsonTypeMapName = userConfig
      ?.getDeclarations()[0]
      .getType()
      .getAliasTypeArguments()[0]
      .getSymbol()
      ?.getName();

    const jsonTypeMapNameValid = jsonTypeMapName && jsonTypeMapName !== '__type';

    if (jsonTypeMapNameValid) {
      const jsonTypeMapInterface = sourceFile.getInterface(jsonTypeMapName);
      if (jsonTypeMapInterface) {
        jsonTypeMapInterface.getMembers().forEach(m => {
          const name = m
            .getSymbol()
            /* c8 ignore next */ ?.getName();
          const match = m
            .getText()
            .match(new RegExp(`^${name}: (.*)`, 's')) /* c8 ignore next */?.[1];
          if (name && match) {
            jsonTypeMaps.push([
              name,
              match
                .split(EOL)
                .map(l => trim(l))
                .join(EOL),
            ]);
          }
        });
      }
    }

    const targetPath = ['typeMap', 'json'];
    let typeMapJsonSet = false;

    userConfig
      /* c8 ignore next */ ?.getDeclarations()[0]
      /* c8 ignore next */ ?.forEachDescendant((node, traveral) => {
        if (targetPath.length === 0) {
          traveral.skip();
        } else if (
          node.getSymbol()?.getName() === targetPath[0] &&
          node.getText() !== targetPath[0] &&
          !node.getText().endsWith('undefined')
        ) {
          targetPath.shift();
          if (
            node
              .getSymbol()
              /* c8 ignore next */
              ?.getName() === 'json'
          ) {
            typeMapJsonSet = true;
          }
        }
      });

    assert(
      typeMapJsonSet ? jsonTypeMapNameValid : /* c8 ignore next */ true,
      'if `typeMap.json` is defined, `UserConfig` requires `JsonTypeDefinitions` argument (`UserConfig<JsonTypeDefinitions>`)',
    );
  };

  if (defaultExportSymbol) {
    const declaration = defaultExportSymbol.getDeclarations()[0];
    if (declaration && Node.isExportAssignment(declaration)) {
      const expr = declaration.getExpression();
      if (Node.isIdentifier(expr)) {
        const symbol = expr.getSymbol();
        assert(
          symbol
            /* c8 ignore next */
            ?.getDeclarations()[0]
            /* c8 ignore next */
            ?.getType()
            .getAliasSymbol()
            /* c8 ignore next */
            ?.getName() === 'UserConfig',
          'default export should have type of UserConfig',
        );
        parseUserConfig(symbol);
      }
    }
  } else if (namedExport) {
    parseUserConfig(namedExport.getSymbol());
  } else {
    throw new Error('no user configuration found in file');
  }

  return jsonTypeMaps;
};
