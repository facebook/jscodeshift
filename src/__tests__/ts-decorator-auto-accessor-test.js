'use strict';

function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source).toSource();
}

transformer.parser = 'ts';

jest.autoMockOff();
const defineInlineTest = require('../../src/testUtils').defineInlineTest;

describe('should be parse typescript decoratorAutoAccessors correctly', function () {
  defineInlineTest(
    transformer,
    {},
    'export class Test {\n' +
    '  public accessor myValue = 10;\n' +
    '}\n',
    'export class Test {\n' +
    '  public accessor myValue = 10;\n' +
    '}',
    'ts-decorator-auto-accessor',
  );
});
