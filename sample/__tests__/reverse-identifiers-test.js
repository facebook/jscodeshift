/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * An example of writing a unit test for a jscodeshift script using the
 * `defineTest` helper bundled with jscodeshift. This will run the
 * reverse-identifiers.js transform with the input specified in the
 * reverse-identifiers-input file, and expect the output to be the same as that
 * in reverse-identifiers-output.
 */

'use strict';

jest.autoMockOff();
const defineTest = require('../../src/testUtils').defineTest;
const defineInlineTest = require('../../src/testUtils').defineInlineTest;
const transform = require('../reverse-identifiers');

defineTest(__dirname, 'reverse-identifiers');

defineTest(__dirname, 'reverse-identifiers', null, 'typescript/reverse-identifiers', { parser: 'ts' });

describe('reverse-identifiers', () => {
  defineInlineTest(transform, {}, `
var firstWord = 'Hello ';
var secondWord = 'world';
var message = firstWord + secondWord;`,`
var droWtsrif = 'Hello ';
var droWdnoces = 'world';
var egassem = droWtsrif + droWdnoces;
  `);
  defineInlineTest(transform, {},
    'function aFunction() {};',
    'function noitcnuFa() {};',
    'Reverses function names'
  );
});
