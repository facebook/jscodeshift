/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, jasmine, describe, pit, expect*/
/*eslint camelcase: 0, no-unused-vars: 0*/

jest.autoMockOff();

// Increase default timeout (5000ms) for Travis
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var temp = require('temp');
require('es6-promise').polyfill();

function run(args, stdin, cwd) {
  return new Promise(resolve => {
    var jscodeshift = child_process.spawn(
      path.join(__dirname, '../jscodeshift.sh'),
      args,
      {
        cwd,
      }
    );
    var stdout = '';
    var stderr = '';
    jscodeshift.stdout.on('data', data => stdout += data);
    jscodeshift.stderr.on('data', data => stderr += data);
    jscodeshift.on('close', () => resolve([stdout, stderr]));
    if (stdin) {
      jscodeshift.stdin.write(stdin);
    }
    jscodeshift.stdin.end();
  });
}

describe('jscodeshift CLI', () => {
  function createTempFileWith(content, filename) {
    var info = temp.openSync();
    var filePath = info.path;
    fs.writeSync(info.fd, content);
    fs.closeSync(info.fd);
    if (filename) {
      filePath = renameFileTo(filePath, filename);
    }
    return filePath;
  }

  function renameFileTo(oldPath, newFilename) {
    var projectPath = path.dirname(oldPath);
    var newPath = path.join(projectPath, newFilename);
    fs.renameSync(oldPath, newPath);
    return newPath;
  }

  function createTransformWith(content) {
    return createTempFileWith(
      'module.exports = function(fileInfo, api, options) { ' + content + ' }'
    );
  }

  pit('calls the transform and file information', () => {
    var sourceA = createTempFileWith('a');
    var sourceB = createTempFileWith('b\n');
    var sourceC = createTempFileWith('c');
    var transformA = createTransformWith(
      'return "transform" + fileInfo.source;'
    );
    var transformB = createTransformWith(
      'return fileInfo.path;'
    );

    return Promise.all([
      run(['-t', transformA, sourceA, sourceB]).then(
        ([stdout, stderr]) => {
          expect(fs.readFileSync(sourceA).toString()).toBe('transforma');
          expect(fs.readFileSync(sourceB).toString()).toBe('transformb\n');
        }
      ),
      run(['-t', transformB, sourceC]).then(
        ([stdout, stderr]) => {
          expect(fs.readFileSync(sourceC).toString()).toBe(sourceC);
        }
      )
    ]);
  });

  pit('does not transform files in a dry run', () => {
    var source = createTempFileWith('a');
    var transform = createTransformWith(
      'return "transform" + fileInfo.source;'
    );
    return run(['-t', transform, '-d', source]).then(
      ([stdout, stderr]) => {
        expect(fs.readFileSync(source).toString()).toBe('a');
      }
    );
  });

  pit('loads transform files with Babel if not disabled', () => {
    var source = createTempFileWith('a');
    var transform = createTransformWith(
      'return (function() { "use strict"; const a = 42; }).toString();'
    );
    return Promise.all([
      run(['-t', transform, source]).then(
        ([stdout, stderr]) => {
          expect(fs.readFileSync(source).toString())
            .toMatch(/var\s*a\s*=\s*42/);
        }
      ),
      run(['-t', transform, '--no-babel', source]).then(
        ([stdout, stderr]) => {
          expect(fs.readFileSync(source).toString())
            .toMatch(/const\s*a\s*=\s*42/);
        }
      ),
    ]);
  });

  pit('ignores .babelrc files in the directories of the source files', () => {
    var transform = createTransformWith(
      'return (function() { "use strict"; const a = 42; }).toString();'
    );
    var babelrc = createTempFileWith(`{"ignore": ["${transform}"]}`, '.babelrc');
    var source = createTempFileWith('a', 'source.js');

    return run(['-t', transform, source]).then(
      ([stdout, stderr]) => {
        expect(fs.readFileSync(source).toString())
          .toMatch(/var\s*a\s*=\s*42/);
      }
    );
  });

  pit('passes jscodeshift and stats the transform function', () => {
    var source = createTempFileWith('a');
    var transform = createTransformWith([
      '  return String(',
      '    typeof api.jscodeshift === "function" &&',
      '    typeof api.stats === "function"',
      '  );',
    ].join('\n'));
    return run(['-t', transform, source]).then(
      ([stdout, stderr]) => {
        expect(fs.readFileSync(source).toString()).toBe('true');
      }
    );
  });

  pit('passes options along to the transform', () => {
    var source = createTempFileWith('a');
    var transform = createTransformWith('return options.foo;');
    return run(['-t', transform, '--foo=42', source]).then(
      ([stdout, stderr]) => {
        expect(fs.readFileSync(source).toString()).toBe('42');
      }
    );
  });

  pit('does not stall with too many files', () => {
    var sources = [];
    for (var i = 0; i < 100; i++) {
      sources.push(createTempFileWith('a'));
    }
    var transform = createTransformWith('');
    return run(['-t', transform, '--foo=42'].concat(sources)).then(
      ([stdout, stderr]) => {
        expect(true).toBe(true);
      }
    );
  });

  describe('ignoring', () => {
    var transform = createTransformWith(
      'return "transform" + fileInfo.source;'
    );
    var sources = [];

    beforeEach(() => {
      sources = [];
      sources.push(createTempFileWith('a', 'a.js'));
      sources.push(createTempFileWith('a', 'a-test.js'));
      // sources.push(createTempFileWith('b', 'src/lib/b.js'));
    });

    pit('does not transform files matched with --ignore-pattern', () => {
      var pattern = '*-test.js';
      return run(['-t', transform, '--ignore-pattern', pattern, ...sources]).then(
        ([stdout, stderr]) => {
          expect(fs.readFileSync(sources[0]).toString()).toBe('transforma');
          expect(fs.readFileSync(sources[1]).toString()).toBe('a');
        }
      );
    });
  });

  describe('output', () => {
    pit('shows workers info and stats at the end by default', () => {
      var source = createTempFileWith('a');
      var transform = createTransformWith('return null;');
      return run(['-t', transform, source]).then(
        ([stdout, stderr]) => {
          expect(stdout).toContain('Processing 1 files...');
          expect(stdout).toContain('Spawning 1 workers...');
          expect(stdout).toContain('Sending 1 files to free worker...');
          expect(stdout).toContain('All done.');
          expect(stdout).toContain('Results: ');
          expect(stdout).toContain('Time elapsed: ');
        }
      );
    });

    pit('does not ouput anything in silent mode', () => {
      var source = createTempFileWith('a');
      var transform = createTransformWith('return null;');
      return run(['-t', transform, '-s', source]).then(
        ([stdout, stderr]) => {
          expect(stdout).toEqual('');
        }
      );
    });
  })
});
