'use strict';

const fs = require('fs');
const picomatch = require('picomatch');

// One rule per added pattern, in the order the patterns were added. `globs`
// approximates the gitignore-style pattern and `negated` is true when the
// pattern started with `!`.
const rules = [];

/**
 * Add glob patterns to ignore matched files and folders.
 * Creates glob patterns to approximate gitignore patterns.
 * @param {String} val - the glob or gitignore-style pattern to ignore
 * @see {@linkplain https://git-scm.com/docs/gitignore#_pattern_format}
 */
function addIgnorePattern(val) {
  if (val && typeof val === 'string' && val[0] !== '#') {
    // As in .gitignore, a leading `!` negates the pattern: paths it matches
    // are included again even if an earlier pattern ignored them. A pattern
    // that starts with a literal `!` can be written as `\!`.
    // See https://github.com/facebook/jscodeshift/issues/342
    const negated = val[0] === '!';
    let pattern = negated ? val.slice(1) : val;
    // `!!foo` re-includes a literal `!foo`, so keep picomatch from reading the
    // second `!` as "anything except".
    if (negated && pattern[0] === '!') {
      pattern = '\\' + pattern;
    }
    if (!pattern) {
      return;
    }
    const globs = [];
    if (negated && pattern[pattern.length-1] === '/') {
      // A negated directory pattern only re-includes the directory itself.
      // The paths inside it are still checked against the other patterns.
      const dir = pattern.slice(0, -1);
      if (!dir) {
        return;
      }
      globs.push('**/' + dir, dir);
    } else if (pattern.indexOf('/') === -1) {
      globs.push('**/' + pattern);
    } else if (pattern[pattern.length-1] === '/') {
      globs.push('**/' + pattern + '**');
      globs.push(pattern + '**');
    }
    globs.push(pattern);
    rules.push({ globs: globs, negated: negated });
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
  if (!rules.length) {
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
  // As in .gitignore, the last rule that matches the path decides whether it
  // is ignored.
  for (let i = rules.length - 1; i >= 0; i--) {
    const globs = rules[i].globs;
    if (
      picomatch.isMatch(path, globs, { dot: true }) ||
      (normalizedPath !== path &&
        picomatch.isMatch(normalizedPath, globs, { dot: true }))
    ) {
      return !rules[i].negated;
    }
  }
  return false;
}

exports.add = addIgnoreFromInput;
exports.addFromFile = addIgnoreFromFile;
exports.shouldIgnore = shouldIgnore;
