/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const union = require('../union');

function test(testCases) {
  for (const testName in testCases) {
    const testCase = testCases[testName];
    it(testName, function() {
      expect(union(testCase.input)).toEqual(testCase.output);
    });
  }
}

describe('union', function() {
  test({
    'unions string values': {
      input: [['foo', 'bar', 'baz'], ['foo', 'bar'], ['bar', 'baz']],
      output: ['foo', 'bar', 'baz'],
    },

    'understands empty input arrays': {
      input: [[], ['foo'], ['bar']],
      output: ['foo', 'bar'],
    },
  });
});

