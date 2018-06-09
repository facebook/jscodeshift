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

const list = function(val, memo) {
  memo.push(val);
  return memo;
}


const Runner = require('../src/Runner.js');

const path = require('path');
const pkg = require('../package.json');
const opts = require('commander')
  .version(function() {
    const requirePackage = require('../utils/requirePackage');
    return [
      `jscodeshift: ${pkg.version}`,
      ` - babel: ${require('babel-core').version}`,
      ` - babylon: ${requirePackage('babylon').version}`,
      ` - flow: ${requirePackage('flow-parser').version}`,
      ` - recast: ${requirePackage('recast').version}`,
    ].join('\n');
  })
  //.command('jscodeshift')
  .arguments('<FILE...>')
  .option('-t, --transform <FILE>', 'Path to the transform file. Can be either a local path or url', './transform.js')
  .option('-c, --cpus <num>', '(all by default) Determines the number of processes started.')
  .option('-v, --verbose [level]', 'Show more information about the transform process', /^(0|1|2)$/i, 0)
  .option('-d, --dry', 'Dry run (no changes are made to files)', false)
  .option('-p, --print', 'Print output, useful for development', false)
  .option('--babel', 'Apply Babel to transform files')
  .option('--no-babel', 'Do not apply Babel to transform files')
  .option('--extensions <extensions>', 'File extensions the transform file should be applied to', 'js')
  .option('--ignore-pattern <pattern>', 'Ignore files that match a provided glob expression', list, [])
  .option('--ignore-config <FILE>',  'Ignore files if they match patterns sourced from a configuration file (e.g., a .gitignore)', list, [])
  .option('--run-in-band', 'Run serially in the current process', 'false') // Might need false default
  .option('-s, --silent',  'No output', false)
  .option('--parser', 'The parser to use for parsing your source files (babel | babylon | flow)', /^(babel|babylon|flow)$/, 'babel')
  .parse(process.argv);

Runner.run(
  /^https?/.test(opts.transform) ? opts.transform : path.resolve(opts.transform),
  opts.args,
  opts
);
