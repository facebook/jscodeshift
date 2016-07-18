/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, jasmine, describe, it, expect, beforeEach*/
/*eslint camelcase: 0, no-unused-vars: 0*/

jest.autoMockOff();

// Increase default timeout (5000ms) for Travis
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000; // 10 minutes

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var temp = require('temp');
var mkdirp = require('mkdirp');
var testUtils = require('../../utils/testUtils');

var createTransformWith = testUtils.createTransformWith;
var createTempFileWith = testUtils.createTempFileWith;

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

  it('calls the transform and file information', () => {
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
        out => {
          expect(out[1]).toBe('');
          expect(fs.readFileSync(sourceA).toString()).toBe('transforma');
          expect(fs.readFileSync(sourceB).toString()).toBe('transformb\n');
        }
      ),
      run(['-t', transformB, sourceC]).then(
        out => {
          expect(out[1]).toBe('');
          expect(fs.readFileSync(sourceC).toString()).toBe(sourceC);
        }
      )
    ]);
  });

  it('does not transform files in a dry run', () => {
    var source = createTempFileWith('a');
    var transform = createTransformWith(
      'return "transform" + fileInfo.source;'
    );
    return run(['-t', transform, '-d', source]).then(
      () => {
        expect(fs.readFileSync(source).toString()).toBe('a');
      }
    );
  });

  describe('Babel', () => {

    it('loads transform files with Babel if not disabled', () => {
      var source = createTempFileWith('a');
      var transform = createTransformWith(
        'return (function() { "use strict"; const a = 42; }).toString();'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          () => {
            expect(fs.readFileSync(source).toString())
              .toMatch(/var\s*a\s*=\s*42/);
          }
        ),
        run(['-t', transform, '--no-babel', source]).then(
          () => {
            expect(fs.readFileSync(source).toString())
              .toMatch(/const\s*a\s*=\s*42/);
          }
        ),
      ]);
    });

    it('supports proposals in transform files', () => {
      var source = createTempFileWith('a');
      var transform = createTransformWith(
        'return (function() {' +
        '  "use strict"; ' +
        '  const spread = {}; ' +
        '  ({...spread})' +
        '}).toString();'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          () => {
            expect(fs.readFileSync(source).toString())
              .toMatch(/\(\{\},\s*spread\)/);
          }
        ),
      ]);
    });

    it('supports flow type annotations in transform files', () => {
      var source = createTempFileWith('a');
      var transform = createTransformWith(
        'return (function() { "use strict"; const a: number = 42; }).toString();'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          () => {
            expect(fs.readFileSync(source).toString())
              .toMatch(/var\s*a\s*=\s*42/);
          }
        ),
      ]);
    });

    it('ignores .babelrc files in the directories of the source files', () => {
      var transform = createTransformWith(
        'return (function() { "use strict"; const a = 42; }).toString();'
      );
      var babelrc = createTempFileWith(`{"ignore": ["${transform}"]}`, '.babelrc');
      var source = createTempFileWith('a', 'source.js');

      return run(['-t', transform, source]).then(
        () => {
          expect(fs.readFileSync(source).toString())
            .toMatch(/var\s*a\s*=\s*42/);
        }
      );
    });

  });

  it('passes jscodeshift and stats the transform function', () => {
    var source = createTempFileWith('a');
    var transform = createTransformWith([
      '  return String(',
      '    typeof api.jscodeshift === "function" &&',
      '    typeof api.stats === "function"',
      '  );',
    ].join('\n'));
    return run(['-t', transform, source]).then(
      () => {
        expect(fs.readFileSync(source).toString()).toBe('true');
      }
    );
  });

  it('passes options along to the transform', () => {
    var source = createTempFileWith('a');
    var transform = createTransformWith('return options.foo;');
    return run(['-t', transform, '--foo=42', source]).then(
      () => {
        expect(fs.readFileSync(source).toString()).toBe('42');
      }
    );
  });

  it('does not stall with too many files', () => {
    var sources = [];
    for (var i = 0; i < 100; i++) {
      sources.push(createTempFileWith('a'));
    }
    var transform = createTransformWith('');
    return run(['-t', transform, '--foo=42'].concat(sources)).then(
      () => {
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

    it('supports basic glob', () => {
      var pattern = '*-test.js';
      return run(['-t', transform, '--ignore-pattern', pattern].concat(sources)).then(
        () => {
          expect(fs.readFileSync(sources[0]).toString()).toBe('transforma');
          expect(fs.readFileSync(sources[1]).toString()).toBe('a');
        }
      );
    });

    it('supports filename match', () => {
      var pattern = 'a.js';
      return run(['-t', transform, '--ignore-pattern', pattern].concat(sources)).then(
        () => {
          expect(fs.readFileSync(sources[0]).toString()).toBe('a');
          expect(fs.readFileSync(sources[1]).toString()).toBe('transforma');
        }
      );
    });

    it('accepts a list of patterns', () => {
      var patterns = ['--ignore-pattern', 'a.js', '--ignore-pattern', '*-test.js'];
      return run(['-t', transform].concat(patterns).concat(sources)).then(
        () => {
          expect(fs.readFileSync(sources[0]).toString()).toBe('a');
          expect(fs.readFileSync(sources[1]).toString()).toBe('a');
        }
      );
    });

    it('sources ignore patterns from configuration file', () => {
      var patterns = ['sub/dir/', '*-test.js'];
      var gitignore = createTempFileWith(patterns.join('\n'), '.gitignore');
      sources.push(createTempFileWith('subfile', 'sub/dir/file.js'));

      return run(['-t', transform, '--ignore-config', gitignore].concat(sources)).then(
        () => {
          expect(fs.readFileSync(sources[0]).toString()).toBe('transforma');
          expect(fs.readFileSync(sources[1]).toString()).toBe('a');
          expect(fs.readFileSync(sources[2]).toString()).toBe('subfile');
        }
      );
    });

    it('accepts a list of configuration files', () => {
      var gitignore = createTempFileWith(['sub/dir/'].join('\n'), '.gitignore');
      var eslintignore = createTempFileWith(['**/*test.js', 'a.js'].join('\n'), '.eslintignore');
      var configs = ['--ignore-config', gitignore, '--ignore-config', eslintignore];
      sources.push(createTempFileWith('subfile', 'sub/dir/file.js'));

      return run(['-t', transform].concat(configs).concat(sources)).then(
        () => {
          expect(fs.readFileSync(sources[0]).toString()).toBe('a');
          expect(fs.readFileSync(sources[1]).toString()).toBe('a');
          expect(fs.readFileSync(sources[2]).toString()).toBe('subfile');
        }
      );
    });
  });

  describe('output', () => {
    it('shows workers info and stats at the end by default', () => {
      var source = createTempFileWith('a');
      var transform = createTransformWith('return null;');
      return run(['-t', transform, source]).then(
        out => {
          expect(out[0]).toContain('Processing 1 files...');
          expect(out[0]).toContain('Spawning 1 workers...');
          expect(out[0]).toContain('Sending 1 files to free worker...');
          expect(out[0]).toContain('All done.');
          expect(out[0]).toContain('Results: ');
          expect(out[0]).toContain('Time elapsed: ');
        }
      );
    });

    it('does not ouput anything in silent mode', () => {
      var source = createTempFileWith('a');
      var transform = createTransformWith('return null;');
      return run(['-t', transform, '-s', source]).then(
        out => {
          expect(out[0]).toEqual('');
        }
      );
    });
  })
});
