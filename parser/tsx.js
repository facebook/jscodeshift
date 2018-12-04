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

const _ = require('lodash');
const babylon = require('@babel/parser');
const baseOptions = require('./tsOptions');

const options = _.merge(baseOptions, { plugins: ['jsx'] });

/**
 * Doesn't accept custom options because babylon should be used directly in
 * that case.
 */
module.exports = function() {
  return {
    parse(code) {
      return babylon.parse(code, options);
    },
  };
};
