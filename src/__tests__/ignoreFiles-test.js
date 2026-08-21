/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*global jest, describe, it, expect, beforeEach*/

'use strict';

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

  describe('with negation (gitignore re-include) patterns', function() {
    // Regression test for https://github.com/facebook/jscodeshift/issues/342
    it('does not ignore every file when only a negation pattern is given', function() {
      ignores.add('!.jenkins/');
      expect(ignores.shouldIgnore('src/index.js')).toBe(false);
      expect(ignores.shouldIgnore('src/foo/bar.js')).toBe(false);
      expect(ignores.shouldIgnore('lib/log.keep')).toBe(false);
    });

    it('re-includes files matched by a prior ignore pattern', function() {
      ignores.add('**/dist/**');
      ignores.add('!**/dist/**/*.md');
      expect(ignores.shouldIgnore('dist/app.js')).toBe(true);
      expect(ignores.shouldIgnore('dist/readme.md')).toBe(false);
      expect(ignores.shouldIgnore('src/main.js')).toBe(false);
    });

    it('re-includes files matched by a negation pattern with a `../` prefix', function() {
      ignores.add('**/node_modules/**');
      ignores.add('!**/node_modules/README.md');
      expect(ignores.shouldIgnore('../src/node_modules/index.js')).toBe(true);
      expect(ignores.shouldIgnore('../src/node_modules/README.md')).toBe(false);
    });
  });
});
