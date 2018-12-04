/**
 * Copyright (c) Facebook, Inc. and its affiliates. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const once = require('../once');

describe('once', function() {
  it('executes the function only once', function() {
    const mock = jest.fn().mockImplementation(foo => foo);
    const wrapped = once(mock);

    wrapped('foo');
    const result = wrapped('bar');

    expect(result).toEqual('foo');
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

