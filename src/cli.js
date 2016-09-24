/*
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

 /* eslint-disable no-console */

const fs = require('fs');

const pkg = require('../package.json');
const Runner = require('../dist/Runner.js');

function dependencyVersions() {
  const requirePackage = require('../utils/requirePackage');
  return [
    ` - babel: ${require('babel-core').version}`,
    ` - babylon: ${requirePackage('babylon').version}`,
    ` - flow: ${requirePackage('flow-parser').version}`,
    ` - recast: ${requirePackage('recast').version}`,
  ].join('\n');
}

const defaults = {
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
      return [
        `jscodeshift: ${pkg.version}`,
        dependencyVersions(),
      ].join('\n');
    },
  },
};

function cliGenerator(cliOptions) {
  const name = cliOptions.name;
  const packageVersion = cliOptions.packageVersion;
  const resolve = cliOptions.resolve;
  const options = cliOptions.options;

  const version = {
    flag: true,
    help: 'print version and exit',
    callback: function() {
      return [
        `${name}: ${packageVersion}`,
        ` - jscodeshift: ${pkg.version}`,
        dependencyVersions(),
      ].join('\n');
    },
  };

  const transform = {
    position: 0,
    help: 'The transformer to use',
    required: true,
  };

  const path = {
    position: 1,
    help: 'Files or directory to transform',
    list: true,
    metavar: 'FILE',
    required: true,
  }

  const args = require('nomnom')
    .script(name)
    .options(Object.assign({}, defaults, {version, transform, path}))
    .parse();

  const transformerPath = resolve(args.transform);
  fs.stat(transformerPath, function (error) {
    if (error) {
      console.error(`The transform ${args.transform} does not exist.`);
      process.exit(1);
    }

    console.log(`Using transform ${args.transform}.`);

    Runner.run(
      transformerPath,
      args.path,
      Object.assign({}, options, args)
    );
  });
}

module.exports = {defaults, cliGenerator};
