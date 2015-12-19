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

var Runner = require('../dist/Runner.js');

var path = require('path');
var opts = require('nomnom')
  .script('jscodeshift')
  .options({
    path: {
      position: 0,
      help: 'Files or directory to transform',
      list: true,
      metavar: 'FILE',
      required: true
    },
    transform: {
      abbr: 't',
      default: './transform.js',
      help: 'Path to the transform file',
      metavar: 'FILE'
    },
    cpus: {
      abbr: 'c',
      help: '(all by default) Determines the number of processes started.'
    },
    verbose: {
      abbr: 'v',
      choices: [0, 1, 2],
      default: 0,
      help: 'Show more information about the transform process'
    },
    dry: {
      abbr: 'd',
      flag: true,
      help: 'Dry run (no changes are made to files)'
    },
    print: {
      abbr: 'p',
      flag: true,
      help: 'Print output, useful for development'
    },
    babel: {
      flag: true,
      default: true,
      help: 'Apply Babel to transform files'
    },
    extensions: {
      default: 'js',
      help: 'File extensions the transform file should be applied to'
    },
    runInBand: {
      flag: true,
      default: false,
      full: 'run-in-band',
      help: 'Run serially in the current process'
    },
    silent: {
      abbr: 's',
      flag: true,
      default: false,
      full: 'silent',
      help: 'No output'
    }
  })
  .parse();

Runner.run(
  path.resolve(opts.transform),
  opts.path,
  opts
);
