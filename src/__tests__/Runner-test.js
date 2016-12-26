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
const temp = require('temp').track();

describe('Runner API', () => {
  describe('getTransform', () => {
    beforeAll(temp.cleanupSync);
    afterEach(temp.cleanupSync);

    it('finds a file given a URL');
    it('finds a file');

    describe('given a directory', () => {
      it('finds a transforms subdirectory');
      it('finds a transform.js file');
      it('finds transforms');
    });

    describe('given a package', () => {
      it('finds a transforms subdirectory');
      it('finds a transform.js file');
      it('finds transforms');
    });

    it('rejects a Promise given an invalid identifier', () => {
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
