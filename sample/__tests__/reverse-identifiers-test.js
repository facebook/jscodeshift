/**
 *  Copyright (c) 2016-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * An example of writing a unit test for a jscodeshift script using the
 * `runTest` helper bundled with jscodeshift. This will run the
 * reverse-identifiers.js transform with the input specified in the
 * reverse-identifiers-input file, and expect the output to be the same as that
 * in reverse-identifiers-output.
 */

'use strict';

jest.autoMockOff();
const defineTest = require('../../src/testUtils').defineTest;

defineTest(__dirname, 'reverse-identifiers');
