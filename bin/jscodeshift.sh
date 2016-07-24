#!/usr/bin/env node
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

const Runner = require('../dist/Runner.js');

const path = require('path');
const pkg = require('../package.json');
const cliOptions = require('../src/cli').defaults;
const opts = require('nomnom')
  .script('jscodeshift')
  .options(cliOptions)
  .parse();

Runner.run(
  /^https?/.test(opts.transform) ? opts.transform : path.resolve(opts.transform),
  opts.path,
  opts
);
