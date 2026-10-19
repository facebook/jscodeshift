/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*global jest, describe, it, expect, beforeEach*/

'use strict';

const fs = require('fs');
const testUtils = require('../../utils/testUtils');

const createTempFileWith = testUtils.createTempFileWith;

describe('ignoreFiles', function() {
  let ignores;

  beforeEach(function() {
    // `ignoreFiles` keeps the registered matchers in module-level state, so
    // reset the module registry to get a clean matcher list for each test.
    jest.resetModules();
    ignores = require('../ignoreFiles');
  });

  it('does not ignore anything when no patterns were added', function() {
    expect(ignores.shouldIgnore('src/node_modules/foo.js')).toBe(false);
  });

  describe('with a glob pattern', function() {
    beforeEach(function() {
      ignores.add('**/node_modules/**');
    });

    it('ignores matching plain relative and absolute paths', function() {
      expect(ignores.shouldIgnore('src/node_modules/foo.js')).toBe(true);
      expect(ignores.shouldIgnore('/abs/src/node_modules/foo.js')).toBe(true);
    });

    // Regression test for https://github.com/facebook/jscodeshift/issues/556
    it('ignores matching paths that start with a `../` or `./` prefix', function() {
      expect(
        ignores.shouldIgnore('../company.reactapp/src/node_modules/foo.js')
      ).toBe(true);
      expect(ignores.shouldIgnore('./src/node_modules/foo.js')).toBe(true);
      expect(ignores.shouldIgnore('../node_modules/foo.js')).toBe(true);
      expect(ignores.shouldIgnore('../../a/b/node_modules/x.js')).toBe(true);
    });

    it('does not ignore non-matching paths with a `../` prefix', function() {
      expect(ignores.shouldIgnore('../src/app.js')).toBe(false);
      expect(ignores.shouldIgnore('../src/components/Button.js')).toBe(false);
    });
  });

  describe('with a bare directory-name pattern', function() {
    beforeEach(function() {
      ignores.add('node_modules');
    });

    it('ignores the directory regardless of a leading `../` prefix', function() {
      expect(ignores.shouldIgnore('src/node_modules')).toBe(true);
      expect(
        ignores.shouldIgnore('../company.reactapp/src/node_modules')
      ).toBe(true);
      expect(ignores.shouldIgnore('../src/lib')).toBe(false);
    });
  });

  it('accepts an array of patterns', function() {
    ignores.add(['**/node_modules/**', '**/dist/**']);
    expect(ignores.shouldIgnore('../src/node_modules/foo.js')).toBe(true);
    expect(ignores.shouldIgnore('../src/dist/bundle.js')).toBe(true);
    expect(ignores.shouldIgnore('../src/index.js')).toBe(false);
  });

  // Regression tests for https://github.com/facebook/jscodeshift/issues/342
  describe('with negated patterns', function() {
    it('does not ignore every file because of a negated pattern', function() {
      ignores.add('!.jenkins/');
      expect(ignores.shouldIgnore('src/index.js')).toBe(false);
      expect(ignores.shouldIgnore('../src/index.js')).toBe(false);
      expect(ignores.shouldIgnore('.jenkins/build.js')).toBe(false);
    });

    it('re-includes paths ignored by an earlier pattern', function() {
      ignores.add(['*.js', '!keep.js']);
      expect(ignores.shouldIgnore('src/index.js')).toBe(true);
      expect(ignores.shouldIgnore('src/keep.js')).toBe(false);
      expect(ignores.shouldIgnore('../src/keep.js')).toBe(false);
    });

    it('re-includes a directory ignored by an earlier pattern', function() {
      ignores.add(['tools/*', '!tools/codemods/']);
      expect(ignores.shouldIgnore('tools/build.js')).toBe(true);
      expect(ignores.shouldIgnore('tools/scripts')).toBe(true);
      expect(ignores.shouldIgnore('tools/codemods')).toBe(false);
      expect(ignores.shouldIgnore('tools/codemods/transform.js')).toBe(false);
    });

    it('re-includes only the directory itself for `!dir/`', function() {
      ignores.add(['node_modules', '*.log', '!.jenkins/']);
      expect(ignores.shouldIgnore('.jenkins')).toBe(false);
      expect(ignores.shouldIgnore('.jenkins/build.js')).toBe(false);
      expect(ignores.shouldIgnore('.jenkins/node_modules')).toBe(true);
      expect(ignores.shouldIgnore('.jenkins/build.log')).toBe(true);
    });

    it('lets the last matching pattern decide', function() {
      ignores.add(['!keep.js', '*.js']);
      expect(ignores.shouldIgnore('src/keep.js')).toBe(true);
    });

    it('still applies the plain patterns around it', function() {
      ignores.add(['**/node_modules/**', '!.jenkins/', 'dist/']);
      expect(ignores.shouldIgnore('src/node_modules/foo.js')).toBe(true);
      expect(ignores.shouldIgnore('../app/node_modules/foo.js')).toBe(true);
      expect(ignores.shouldIgnore('dist/bundle.js')).toBe(true);
      expect(ignores.shouldIgnore('src/index.js')).toBe(false);
    });

    it('treats a leading `\\!` as a literal `!`', function() {
      ignores.add('\\!important.js');
      expect(ignores.shouldIgnore('src/!important.js')).toBe(true);
      expect(ignores.shouldIgnore('src/important.js')).toBe(false);
    });

    it('treats `!!foo` as a negated literal `!foo`', function() {
      ignores.add(['*.js', '!!keep.js']);
      expect(ignores.shouldIgnore('src/a.js')).toBe(true);
      expect(ignores.shouldIgnore('src/keep.js')).toBe(true);
      expect(ignores.shouldIgnore('src/!keep.js')).toBe(false);
    });

    it('skips a negation with nothing after it', function() {
      ignores.add(['*.js', '!', '!/']);
      expect(ignores.shouldIgnore('src/a.js')).toBe(true);
      expect(ignores.shouldIgnore('src/a.ts')).toBe(false);
    });

    it('reads negated patterns from an ignore config file', function() {
      const config = createTempFileWith(
        ['node_modules/', '!.jenkins/', ''].join('\n')
      );
      ignores.addFromFile(config);
      fs.unlinkSync(config);
      expect(ignores.shouldIgnore('node_modules/foo.js')).toBe(true);
      expect(ignores.shouldIgnore('src/index.js')).toBe(false);
      expect(ignores.shouldIgnore('.jenkins/build.js')).toBe(false);
    });
  });
});
