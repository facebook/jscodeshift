/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*global jest, describe, it, expect*/

'use strict';

jest.mock('@babel/parser')
const babylon = require('@babel/parser');

const tsxParser = require('../tsx');

describe('tsxParser', function() {
  describe('parse', function() {
    it('extends the ts config with jsx support', function() {
      const parser = tsxParser();
      parser.parse('"mock content";');

      expect(babylon.parse).toHaveBeenCalledTimes(1);
      expect(babylon.parse.mock.calls[0]).toMatchSnapshot();
    });
  });
});
