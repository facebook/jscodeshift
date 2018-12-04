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

const flowParser = require('flow-parser');

const defaultOptions = {
  esproposal_class_instance_fields: true,
  esproposal_class_static_fields: true,
  esproposal_decorators: true,
  esproposal_export_star_as: true,
  esproposal_optional_chaining: true,
  esproposal_nullish_coalescing: true,
  tokens: true,
  types: true,
};

/**
 * Wrapper to set default options
 */
module.exports = function(options=defaultOptions) {
  return {
    parse(code) {
      return flowParser.parse(code, options);
    },
  };
};
