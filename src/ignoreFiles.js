'use strict';

const fs = require('fs');
const mm = require('micromatch');

const matchers = [];

function addIgnorePattern(val) {
  if (val && typeof val === 'string') {
    let pattern = val;
    if (pattern.indexOf('/') === -1) {
      matchers.push('**/' + pattern);
    } else if (pattern[pattern.length-1] === '/') {
      matchers.push('**/' + pattern + '**');
      matchers.push(pattern + '**');
    }
    matchers.push(pattern);
  }
}

function addIgnoreFromFile(input) {
  let lines = [];
  let files = [];
  if (input) {
    files = files.concat(input);
  }

  files.forEach(function(config) {
    var stats = fs.statSync(config);
    if (stats.isFile()) {
      var content = fs.readFileSync(config, 'utf8');
      lines = lines.concat(content.split('\n'));
    }
  });

  lines.forEach(addIgnorePattern);
}

function shouldIgnore(path) {
  var matched = matchers.length ? mm.any(path, matchers, { dot:true }) : false;
  return matched;
}

exports.add = addIgnorePattern;
exports.addFromFile = addIgnoreFromFile;
exports.shouldIgnore = shouldIgnore;
