/*
 *  Copyright (c) 2016-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

const getTransform = require('../Runner').getTransform;

describe('Runner API', () => {
  describe('getTransform', () => {
    it('errors on failure', () => {
      function expectError(error) {
        expect(error).toBe('Transform not valid does not exist');
      }

      // Expect a specific Promise rejection.
      return Promise
        .resolve(getTransform('not valid'))
        .then(expectError, expectError);
    });
  });
});
