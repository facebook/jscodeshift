#!/usr/bin/env node

"use strict";

var Runner = require('../dist/Runner.js');

var path = require('path');
var yargs = require('yargs')
  .usage(
    'Transform JS files given a transform script.\n' +
    'The script must export a single function, accepting source code ' +
    'and returning the modified source\nUsage: $0'
  )
  .example(
    '$0 -t transform.js src/*.js',
    'Use transform.js to transform all *.js in src/'
  )
  .describe('t', 'Path to the transform file')
  .default('t', './transform.js')
  .boolean('h')
  .alias('h', 'help');

var argv = yargs.argv;

if (argv.help) {
  console.log(yargs.help());
}

Runner.run(path.resolve(argv.t), argv._);
