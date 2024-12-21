/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const testSyncTransform = require('../__testfixtures__/test-sync-transform');
const testAsyncTransform = require('../__testfixtures__/test-async-transform');

const testUtils = require('../testUtils');

const testInputSource = 'export const sum = (a, b) => a + b;';
const expectedInlineOutput = 'export const addition = (a, b) => a + b;';

const getModuleToTransform = () => {
  const moduleToTransformPath = path.join(__dirname, '..', '__testfixtures__', 'test-sync-transform.input.js');
  const source = fs.readFileSync(moduleToTransformPath, 'utf8');
  return {
    path: moduleToTransformPath,
    source,
  }
}

describe('testUtils', () => {
  describe('synchronous', () => {
    it('should apply transformation', () => {
      const moduleToTransform = getModuleToTransform();
      const transformedCode = testUtils.applyTransform(testSyncTransform, null, moduleToTransform);

      expect(transformedCode).not.toMatch(/sum/);
      expect(transformedCode).toMatch(/addition/);
    });

    it('should run test', () => {
      testUtils.runTest(
        __dirname,
        path.join('__testfixtures__',
        'test-sync-transform'),
        null,
        'test-sync-transform'
      );
    });

    it ('should run snapshot test', () => {
      const moduleToTransform = getModuleToTransform();
      testUtils.runSnapshotTest(testSyncTransform, null, moduleToTransform);
    });

    it('should run inline test', () => {
      const moduleToTransform = getModuleToTransform();
      testUtils.runInlineTest(testSyncTransform, null, moduleToTransform, expectedInlineOutput);
    });

    testUtils.defineTest(
      __dirname,
      path.join('__testfixtures__', 'test-sync-transform'),
      null,
      'test-sync-transform'
    );

    testUtils.defineInlineTest(
      testSyncTransform,
      null,
      testInputSource,
      expectedInlineOutput,
      'should run sync defineInlineTest'
    );

    testUtils.defineSnapshotTest(
      testSyncTransform,
      null,
      testInputSource,
      'should run sync defineSnapshotTest'
    );

    testUtils.defineSnapshotTestFromFixture(
      __dirname,
      testSyncTransform,
      null,
      'test-sync-transform',
      'should run sync defineSnapshotTestFromFixture'
    );
  });

  describe('async', () => {
    it('should apply transformation', async () => {
      const moduleToTransform = getModuleToTransform();
      const transformedCode = await testUtils.applyTransform(testAsyncTransform, null, moduleToTransform);

      expect(transformedCode).not.toMatch(/sum/);
      expect(transformedCode).toMatch(/addition/);
    });

    it('should run test', () => {
      return testUtils.runTest(__dirname, path.join('__testfixtures__', 'test-async-transform'), null, 'test-async-transform');
    });

    it ('should run snapshot test', () => {
      const moduleToTransform = getModuleToTransform();
      return testUtils.runSnapshotTest(testAsyncTransform, null, moduleToTransform);
    });

    it('should run inline test', () => {
      const moduleToTransform = getModuleToTransform();
      return testUtils.runInlineTest(testAsyncTransform, null, moduleToTransform, expectedInlineOutput);
    });

    testUtils.defineTest(
      __dirname,
      path.join('__testfixtures__', 'test-async-transform'),
      null,
      'test-async-transform'
    );

    testUtils.defineInlineTest(
      testAsyncTransform,
      null,
      testInputSource,
      expectedInlineOutput,
      'should run async defineInlineTest'
    );

    testUtils.defineSnapshotTest(
      testAsyncTransform,
      null,
      testInputSource,
      'should run async defineSnapshotTest'
    );

    testUtils.defineSnapshotTestFromFixture(
      __dirname,
      testSyncTransform,
      null,
      'test-async-transform',
      'should run async defineSnapshotTestFromFixture'
    );
  });
});
