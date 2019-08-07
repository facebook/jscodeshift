
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*global jest, jasmine, describe, it, expect, beforeEach*/
/*eslint camelcase: 0, no-unused-vars: 0*/

jest.autoMockOff();

// Increase default timeout (5000ms) for Travis
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000; // 10 minutes

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const temp = require('temp');
const mkdirp = require('mkdirp');
const testUtils = require('../../utils/testUtils');

const createTransformWith = testUtils.createTransformWith;
const createTempFileWith = testUtils.createTempFileWith;

function readFile(path) {
  return fs.readFileSync(path).toString();
}

function run(args, stdin, cwd) {
  return new Promise(resolve => {
    const jscodeshift = child_process.spawn(
      path.join(__dirname, '../jscodeshift.sh'),
      args,
      {
        cwd,
      }
    );
    let stdout = '';
    let stderr = '';
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
    const sourceA = createTempFileWith('a');
    const sourceB = createTempFileWith('b\n');
    const sourceC = createTempFileWith('c');
    const transformA = createTransformWith(
      'return "transform" + fileInfo.source;'
    );
    const transformB = createTransformWith(
      'return fileInfo.path;'
    );

    return Promise.all([
      run(['-t', transformA, sourceA, sourceB]).then(
        out => {
          expect(out[1]).toBe('');
          expect(readFile(sourceA)).toBe('transforma');
          expect(readFile(sourceB)).toBe('transformb\n');
        }
      ),
      run(['-t', transformB, sourceC]).then(
        out => {
          expect(out[1]).toBe('');
          expect(readFile(sourceC)).toBe(sourceC);
        }
      )
    ]);
  });

  it('takes file list from stdin if --stdin is set', () => {
    const sourceA = createTempFileWith('a');
    const sourceB = createTempFileWith('b\n');
    const sourceC = createTempFileWith('c');
    const transformA = createTransformWith(
      'return "transform" + fileInfo.source;'
    );

    return run(['--stdin', '-t', transformA], [sourceA, sourceB, sourceC].join('\n')).then(
      out => {
        expect(out[1]).toBe('');
        expect(readFile(sourceA)).toBe('transforma');
        expect(readFile(sourceB)).toBe('transformb\n');
        expect(readFile(sourceC)).toBe('transformc');
      }
    );
  });

  it('does not transform files in a dry run', () => {
    const source = createTempFileWith('a');
    const transform = createTransformWith(
      'return "transform" + fileInfo.source;'
    );
    return run(['-t', transform, '-d', source]).then(
      () => {
        expect(readFile(source).toString()).toBe('a');
      }
    );
  });

  describe('Babel', () => {

    // Verifiers that ES6 features are supported either natively or via Babel
    it('supports ES6 features in transform files', () => {
      const source = createTempFileWith('a');
      const transform = createTransformWith(
        'const a = 42; return a;'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          () => {
            expect(readFile(source).toString())
              .toEqual('42');
          }
        ),
      ]);
    });

    // Verifies that spread is supported, either natively over via Babel
    it('supports property spread in transform files', () => {
      const source = createTempFileWith('a');
      const transform = createTransformWith(
        'const a = {...{foo: 42}, bar: 21}; return a.foo;'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          () => {
            expect(readFile(source).toString())
              .toEqual('42');
          }
        ),
      ]);
    });

    it('supports class properties in transform files', () => {
      const source = createTempFileWith('a');
      const transform = createTransformWith(`
        return (class {
          x = 42;
        }).toString();
      `);
      return Promise.all([
        run(['-t', transform, source]).then(
          () => {
            expect(readFile(source).toString())
              .toMatch(/\(this,\s*['"]x['"]/);
          }
        ),
      ]);
    });

    it('supports flow type annotations in transform files', () => {
      const source = createTempFileWith('a');
      const transform = createTransformWith(
        'return (function() { "use strict"; const a: number = 42; }).toString();'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          () => {
            expect(readFile(source).toString())
              .toMatch(/a\s*=\s*42/);
          }
        ),
      ]);
    });

    it('supports Typescript type annotations in transform files', () => {
      const source = createTempFileWith('a');
      const transform = createTransformWith(
        'return (function() { "use strict"; function foo(x: string): x is string {}}).toString();',
        '.ts'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          args => {
            expect(readFile(source).toString())
              .toMatch(/function\s+foo\(x\)\s*{}/);
          }
        ),
      ]);
    });

    it('transpiles imported Typescript files in transform files', () => {
      const source = createTempFileWith('a');
      const helper = createTempFileWith(
        'module.exports = function(x: string): x is string {};',
        undefined,
        '.ts'
      );
      const transform = createTransformWith(
        `return require('${helper}').toString();`,
        '.ts'
      );
      return Promise.all([
        run(['-t', transform, source]).then(
          args => {
            expect(readFile(source).toString())
              .toMatch(/function\s*\(x\)\s*{}/);
          }
        ),
      ]);
    });

  });

  it('passes jscodeshift and stats the transform function', () => {
    const source = createTempFileWith('a');
    const transform = createTransformWith([
      '  return String(',
      '    typeof api.jscodeshift === "function" &&',
      '    typeof api.stats === "function"',
      '  );',
    ].join('\n'));
    return run(['-t', transform, source]).then(
      () => {
        expect(readFile(source).toString()).toBe('true');
      }
    );
  });

  it('passes options along to the transform', () => {
    const source = createTempFileWith('a');
    const transform = createTransformWith('return options.foo;');
    return run(['-t', transform, '--foo=42', source]).then(
      () => {
        expect(readFile(source).toString()).toBe('42');
      }
    );
  });
  it('does not stall with too many files', () => {
    const sources = [];
    for (let i = 0; i < 100; i++) {
      sources.push(createTempFileWith('a'));
    }
    const transform = createTransformWith('');
    return run(['-t', transform, '--foo=42'].concat(sources)).then(
      () => {
        expect(true).toBe(true);
      }
    );
  });

  describe('ignoring', () => {
    const transform = createTransformWith(
      'return "transform" + fileInfo.source;'
    );
    let sources = [];

    beforeEach(() => {
      sources = [];
      sources.push(createTempFileWith('a', 'a.js'));
      sources.push(createTempFileWith('a', 'a-test.js'));
      // sources.push(createTempFileWith('b', 'src/lib/b.js'));
    });

    it('supports basic glob', () => {
      const pattern = '*-test.js';
      return run(['-t', transform, '--ignore-pattern', pattern].concat(sources)).then(
        () => {
          expect(readFile(sources[0]).toString()).toBe('transforma');
          expect(readFile(sources[1]).toString()).toBe('a');
        }
      );
    });

    it('supports filename match', () => {
      const pattern = 'a.js';
      return run(['-t', transform, '--ignore-pattern', pattern].concat(sources)).then(
        () => {
          expect(readFile(sources[0]).toString()).toBe('a');
          expect(readFile(sources[1]).toString()).toBe('transforma');
        }
      );
    });

    it('accepts a list of patterns', () => {
      const patterns = ['--ignore-pattern', 'a.js', '--ignore-pattern', '*-test.js'];
      return run(['-t', transform].concat(patterns).concat(sources)).then(
        () => {
          expect(readFile(sources[0]).toString()).toBe('a');
          expect(readFile(sources[1]).toString()).toBe('a');
        }
      );
    });

    it('sources ignore patterns from configuration file', () => {
      const patterns = ['sub/dir/', '*-test.js'];
      const gitignore = createTempFileWith(patterns.join('\n'), '.gitignore');
      sources.push(createTempFileWith('subfile', 'sub/dir/file.js'));

      return run(['-t', transform, '--ignore-config', gitignore].concat(sources)).then(
        () => {
          expect(readFile(sources[0]).toString()).toBe('transforma');
          expect(readFile(sources[1]).toString()).toBe('a');
          expect(readFile(sources[2]).toString()).toBe('subfile');
        }
      );
    });

    it('accepts a list of configuration files', () => {
      const gitignore = createTempFileWith(['sub/dir/'].join('\n'), '.gitignore');
      const eslintignore = createTempFileWith(['**/*test.js', 'a.js'].join('\n'), '.eslintignore');
      const configs = ['--ignore-config', gitignore, '--ignore-config', eslintignore];
      sources.push(createTempFileWith('subfile', 'sub/dir/file.js'));

      return run(['-t', transform].concat(configs).concat(sources)).then(
        () => {
          expect(readFile(sources[0]).toString()).toBe('a');
          expect(readFile(sources[1]).toString()).toBe('a');
          expect(readFile(sources[2]).toString()).toBe('subfile');
        }
      );
    });
  });

  describe('output', () => {
    it('shows workers info and stats at the end by default', () => {
      const source = createTempFileWith('a');
      const transform = createTransformWith('return null;');
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
      const source = createTempFileWith('a');
      const transform = createTransformWith('return null;');
      return run(['-t', transform, '-s', source]).then(
        out => {
          expect(out[0]).toEqual('');
        }
      );
    });
  });

  describe('--parser=ts', () => {
    it('parses TypeScript sources', () => {
      const source = createTempFileWith('type Foo = string | string[];');
      const transform = createTransformWith(
        'api.jscodeshift(fileInfo.source)\nreturn "changed";'
      );
      return run([
        '-t', transform,
        '--parser', 'ts',
        '--run-in-band',
        source,
      ]).then(
        out => {
          expect(out[0]).not.toContain('Transformation error');
          expect(readFile(source)).toEqual('changed');
        }
      );
    });
  });

  describe('--parser-config', () => {
    it('allows custom parser settings to be passed', () => {
      // @decorators before export are not supported in the current default
      // config
      const source = createTempFileWith('@foo\nexport class Bar {}');
      const parserConfig = createTempFileWith(JSON.stringify({
        sourceType: 'module',
        tokens: true,
        plugins: [
          ['decorators', {decoratorsBeforeExport: true}],
        ],
      }));
      const transform = createTransformWith(
        'api.jscodeshift(fileInfo.source)\nreturn "changed";'
      );
      return run([
        '-t', transform,
        '--parser-config', parserConfig,
        '--parser', 'babylon',
        '--run-in-band',
        source,
      ]).then(
        out => {
          expect(out[0]).not.toContain('Transformation error');
          expect(readFile(source)).toEqual('changed');
        }
      );
    });
  });

});
