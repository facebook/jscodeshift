'use strict';

const fs = require('fs');
const picomatch = require('picomatch');

const matchers = [];
const negatedMatchers = [];

/**
 * Add glob patterns to ignore matched files and folders.
 * Creates glob patterns to approximate gitignore patterns.
 *
 * A leading `!` marks a negation pattern (gitignore "re-include"): paths that
 * match a negation pattern are not ignored, even if they also match an ignore
 * pattern. Negation patterns are tracked separately so that a bare `!pattern`
 * (e.g. `!.jenkins/`) never inverts the whole matcher set and causes every
 * file to be ignored. See https://github.com/facebook/jscodeshift/issues/342
 *
 * @param {String} val - the glob or gitignore-style pattern to ignore
 * @see {@linkplain https://git-scm.com/docs/gitignore#_pattern_format}
 */
function addIgnorePattern(val) {
  if (val && typeof val === 'string' && val[0] !== '#') {
    let negated = false;
    let pattern = val;
    if (pattern[0] === '!') {
      negated = true;
      pattern = pattern.slice(1);
      if (!pattern) {
        return;
      }
    }
    const target = negated ? negatedMatchers : matchers;
    if (pattern.indexOf('/') === -1) {
      target.push('**/' + pattern);
    } else if (pattern[pattern.length-1] === '/') {
      target.push('**/' + pattern + '**');
      target.push(pattern + '**');
    }
    target.push(pattern);
  }
}

/**
 * Adds ignore patterns directly from function input
 * @param {String|Array<String>} input - the ignore patterns
 */
function addIgnoreFromInput(input) {
  let patterns = [];
  if (input) {
    patterns = patterns.concat(input);
  }
  patterns.forEach(addIgnorePattern);
}

/**
 * Adds ignore patterns by reading files
 * @param {String|Array<String>} input - the paths to the ignore config files
 */
function addIgnoreFromFile(input) {
  let lines = [];
  let files = [];
  if (input) {
    files = files.concat(input);
  }

  files.forEach(function(config) {
    const stats = fs.statSync(config);
    if (stats.isFile()) {
      const content = fs.readFileSync(config, 'utf8');
      lines = lines.concat(content.split(/\r?\n/));
    }
  });

  lines.forEach(addIgnorePattern);
}

function shouldIgnore(path) {
  if (!matchers.length) {
    return false;
  }
  // Files discovered from a relative source path (e.g. `../src` or `./src`)
  // are enumerated with a leading `../` or `./` traversal prefix. picomatch's
  // `**` wildcard does not match across such a leading traversal segment, so
  // ignore patterns like `**/node_modules/**` silently fail to match those
  // paths even though they match the equivalent absolute or plain relative
  // paths. Match against the path with any leading traversal prefix stripped
  // so ignore behavior is consistent regardless of how the source path was
  // specified. See https://github.com/facebook/jscodeshift/issues/556
  const normalizedPath = path.replace(/^(?:\.\.?[/\\])+/, '');
  const matches = list =>
    picomatch.isMatch(path, list, { dot: true }) ||
    (normalizedPath !== path &&
      picomatch.isMatch(normalizedPath, list, { dot: true }));

  if (!matches(matchers)) {
    return false;
  }
  // A negation (re-include) pattern wins over ignore patterns.
  return !(negatedMatchers.length && matches(negatedMatchers));
}

exports.add = addIgnoreFromInput;
exports.addFromFile = addIgnoreFromFile;
exports.shouldIgnore = shouldIgnore;
