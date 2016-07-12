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
const opts = require('nomnom')
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
      help: 'Path to the transform file. Can be either a local path or url',
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
    ignorePattern: {
      full: 'ignore-pattern',
      list: true,
      help: 'Ignore files that match a provided glob expression'
    },
    ignoreConfig: {
      full: 'ignore-config',
      list: true,
      help: 'Ignore files if they match patterns sourced from a configuration file (e.g., a .gitignore)',
      metavar: 'FILE'
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
    },
    parser: {
      choices: ['babel', 'babylon', 'flow'],
      default: 'babel',
      full: 'parser',
      help: 'The parser to use for parsing your source files (babel | babylon | flow)'
    },
    version: {
      flag: true,
      help: 'print version and exit',
      callback: function() {
        const requirePackage = require('../utils/requirePackage');
        return [
          `jscodeshift: ${pkg.version}`,
          ` - babel: ${require('babel-core').version}`,
          ` - babylon: ${requirePackage('babylon').version}`,
          ` - flow: ${requirePackage('flow-parser').version}`,
          ` - recast: ${requirePackage('recast').version}`,
        ].join('\n');
      },
    },
  })
  .parse();

Runner.run(
  /^https?/.test(opts.transform) ? opts.transform : path.resolve(opts.transform), 
  opts.path,
  opts
);
