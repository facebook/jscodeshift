"use strict";

jest.autoMockOff();
const defineTest = require("../../src/testUtils").defineTest;

describe("should be parse typescript decoratorAutoAccessors correctly", function () {
  defineTest(__dirname, "ts-decorator-auto-accessor", null, null, {
    parser: "ts",
  });
});
