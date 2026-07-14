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
const testTsxTransform = require('../__testfixtures__/test-tsx-transform');

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

  // The fixtures below are written in TypeScript and only parse with the `tsx`
  // parser, which is selected exclusively via `testOptions.parser`. If a helper
  // fails to forward `testOptions` to `applyTransform`, the transform runs with
  // the default parser and throws on the `enum` declaration. See #581.
  describe('testOptions propagation', () => {
    const tsxInput =
      'enum Direction { Up, Down }\nexport const sum = (a: number, b: number): number => a + b;';
    const tsxExpectedOutput =
      'enum Direction { Up, Down }\nexport const addition = (a: number, b: number): number => a + b;';
    const tsxOptions = { parser: 'tsx' };

    it('runSnapshotTest forwards testOptions.parser', () => {
      testUtils.runSnapshotTest(
        testTsxTransform,
        null,
        { source: tsxInput },
        tsxOptions
      );
    });

    it('runInlineTest forwards testOptions.parser', () => {
      testUtils.runInlineTest(
        testTsxTransform,
        null,
        { source: tsxInput },
        tsxExpectedOutput,
        tsxOptions
      );
    });

    testUtils.defineInlineTest(
      testTsxTransform,
      null,
      tsxInput,
      tsxExpectedOutput,
      'defineInlineTest forwards testOptions.parser',
      tsxOptions
    );

    testUtils.defineSnapshotTest(
      testTsxTransform,
      null,
      tsxInput,
      'defineSnapshotTest forwards testOptions.parser',
      tsxOptions
    );

    testUtils.defineSnapshotTestFromFixture(
      __dirname,
      testTsxTransform,
      null,
      'test-tsx-transform',
      'defineSnapshotTestFromFixture forwards testOptions.parser',
      tsxOptions
    );
  });
});
