/*
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

/*global jest, describe, it, expect*/

jest.autoMockOff();

const cp = require('child_process');
const resolve = require('path').resolve;
const cli = resolve(__dirname, 'custom-cli');

function execFile(file, args) {
  return new Promise((resolve, reject) => {
    cp.execFile(file, args, (error, output) => {
      if (error) return reject(error);

      resolve(output);
    });
  });
}

describe('Custom CLI', function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

  it('should show help when --help is passed', function() {
    return execFile(cli, ['--help'])
      .then(function (result) {
        expect(result).toContain('Usage: Custom CLI <transform> <path>');
      })
  });

  it('should resolve transform', function() {
    return execFile(cli, ['noop', resolve(__dirname, 'custom-cli-test.js')])
      .then(function (result) {
        expect(result).toContain('Using transform noop');
        expect(result).toContain('Processing 1 files...');
      })
  });

  it('should fail when transform is not resolved', function() {
    let catched = false;
    return execFile(cli, ['non-existing-codemod', resolve(__dirname, 'custom-cli-test.js')])
      .catch(function (error) {
        catched = true;
        expect(error.toString()).toContain('The transform non-existing-codemod does not exist.')
      })
      .then(() => {
        expect(catched).toBe(true);
      });
  });
});
