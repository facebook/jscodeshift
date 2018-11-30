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

const Runner = require('../src/Runner.js');

const path = require('path');
const pkg = require('../package.json');
const parser = require('../src/argsParser')
  .options({
    transform: {
      abbr: 't',
      default: './transform.js',
      help: 'path to the transform file. Can be either a local path or url',
      metavar: 'FILE',
      required: true
    },
    cpus: {
      abbr: 'c',
      help: 'start at most N child processes to process source files',
      defaultHelp: 'max(all - 1, 1)',
      metavar: 'N',
    },
    verbose: {
      abbr: 'v',
      choices: [0, 1, 2],
      default: 0,
      help: 'show more information about the transform process',
      metavar: 'N',
    },
    dry: {
      abbr: 'd',
      flag: true,
      default: false,
      help: 'dry run (no changes are made to files)'
    },
    print: {
      abbr: 'p',
      flag: true,
      default: false,
      help: 'print transformed files to stdout, useful for development'
    },
    babel: {
      flag: true,
      default: true,
      help: 'apply babeljs to the transform file'
    },
    extensions: {
      default: 'js',
      help: 'transform files with these file extensions (comma separated list)',
      metavar: 'EXT',
    },
    ignorePattern: {
      full: 'ignore-pattern',
      list: true,
      help: 'ignore files that match a provided glob expression',
      metavar: 'GLOB',
    },
    ignoreConfig: {
      full: 'ignore-config',
      list: true,
      help: 'ignore files if they match patterns sourced from a configuration file (e.g. a .gitignore)',
      metavar: 'FILE'
    },
    runInBand: {
      flag: true,
      default: false,
      full: 'run-in-band',
      help: 'run serially in the current process'
    },
    silent: {
      abbr: 's',
      flag: true,
      default: false,
      help: 'do not write to stdout or stderr'
    },
    parser: {
      choices: ['babel', 'babylon', 'flow', 'ts', 'tsx'],
      default: 'babel',
      help: 'the parser to use for parsing the source files'
    },
    version: {
      help: 'print version and exit',
      callback: function() {
        const requirePackage = require('../utils/requirePackage');
        return [
          `jscodeshift: ${pkg.version}`,
          ` - babel: ${require('babel-core').version}`,
          ` - babylon: ${requirePackage('@babel/parser').version}`,
          ` - flow: ${requirePackage('flow-parser').version}`,
          ` - recast: ${requirePackage('recast').version}\n`,
        ].join('\n');
      },
    },
  });

let options, positionalArguments;
try {
  ({options, positionalArguments} = parser.parse());
  if (positionalArguments.length === 0) {
    process.stderr.write(
      'Error: You have to provide at least one file/directory to transform.' +
      '\n\n---\n\n' +
      parser.getHelpText()
    );
    process.exit(1);
  }
} catch(e) {
  const exitCode = e.exitCode === undefined ? 1 : e.exitCode;
  (exitCode ? process.stderr : process.stdout).write(e.message);
  process.exit(exitCode);
}

Runner.run(
  /^https?/.test(options.transform) ? options.transform : path.resolve(options.transform),
  positionalArguments,
  options
);
