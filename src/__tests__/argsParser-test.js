/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*global jest, describe, it, expect, beforeEach*/

'use strict';

const argsParser = require('../argsParser');

describe('argsParser', function() {
  it('prints the help text', function() {
    const parser = argsParser.options({});
    let exception;
    try {
      parser.parse(['--help']);
    } catch(e) {
      exception = e;
    }
    expect(exception.exitCode).toEqual(0);
    expect(exception.message).toEqual(parser.getHelpText());
  });

  it('parsers positional arguments', function() {
    const parser = argsParser.options({});
    const {positionalArguments} = parser.parse(['foo', 'bar']);
    expect(positionalArguments).toEqual(['foo', 'bar']);
  });

  it('parsers mixed options, flags and positional arguments', function() {
    const parser = argsParser.options({
      foo: {},
      bar: {
        flag: true,
      },
      bay: {
        flag: true,
      },
      baz: {
        default: 'zab',
      },
    });
    expect(parser.parse(['arg1', '--foo=1', 'arg2', '--bar', '--bay=1', 'arg3', 'arg4']))
      .toEqual({
        options: {
          foo: '1',
          bar: true,
          bay: true,
          baz: 'zab',
        },
        positionalArguments: ['arg1', 'arg2', 'arg3', 'arg4'],
      });
  });

  describe('options', function() {
    function test(testCases) {
      for (const testName in testCases) {
        const testCase = testCases[testName];

        const parser = argsParser.options(testCase.options);

        it(testName + ' (space separated values)', function() {
          const parse = () => parser.parse(
            Array.prototype.concat.apply([], testCase.args)
          );

          if (typeof testCase.expected === 'string') {
            expect(parse).toThrowError(testCase.expected);
          } else {
            expect(parse()).toEqual(testCase.expected);
          }
        });

        it(testName + ' (= separated values)', function() {
          const parse = () => parser.parse(
            testCase.args.map(args => args.join('='))
          );
          if (typeof testCase.expected === 'string') {
            expect(parse).toThrowError(testCase.expected);
          } else {
            expect(parse()).toEqual(testCase.expected);
          }
        });

      }
    }

    test({
      'understands separate arg name and short option names': {
        options: {
          foo: {
            full: 'another-foo',
          },
          bar: {
            abbr: 'b',
          },
        },
        args: [['--another-foo', 'oof'], ['-b', 'rab']],
        expected: {
          options: {
            foo: 'oof',
            bar: 'rab',
          },
          positionalArguments: []
        },
      },

      'understands default values': {
        options: {
          foo: {},
          bar: {
            default: 'rab',
          },
          baz: {
            abbr: 'b',
            default: 'zab',
          },
        },
        args: [['--foo', 'oof']],
        expected: {
          options: {
            foo: 'oof',
            bar: 'rab',
            baz: 'zab',
          },
          positionalArguments: []
        },
      },

      'allows preprocessing values': {
        options: {
          foo: {},
          bar: {
            default: 456,
          },
          bay: {
            process: Number,
          },
          baz: {
            abbr: 'b',
            process: v => v+v,
          },
        },
        args: [['--foo', '123'], ['--bay', '789'], ['-b', 'zab']],
        expected: {
          options: {
            foo: '123',
            bar: 456,
            bay: 789,
            baz: 'zabzab',
          },
          positionalArguments: []
        },
      },

      'understands lists': {
        options: {
          foo: {
            list: true,
          },
          bar: {
            list: true,
          },
          baz: {},
        },
        args: [
          ['--foo', 'oof1'],
          ['--baz', 'zab1'],
          ['--foo', 'oof2'],
          ['--baz', 'zab2'],
        ],
        expected: {
          options: {
            foo: ['oof1', 'oof2'],
            bar: [],
            baz: 'zab2',
          },
          positionalArguments: []
        },
      },

      'errors when an option does not have a value (1)': {
        options: {
          foo: {},
          bar: {
            abbr: 'b',
          },
          baz: {},
        },
        args: [
          ['--foo', 'oof'],
          ['-b'],
          ['--baz', 'zab'],
        ],
        expected: '--bar requires a value',
      },

      'errors when an option does not have a value (2)': {
        options: {
          foo: {},
          bar: {
            abbr: 'b',
          },
          baz: {},
        },
        args: [
          ['--foo', 'oof'],
          ['--bar'],
          ['--baz', 'zab'],
        ],
        expected: '--bar requires a value',
      },

      'errors when an option does not have a value (3)': {
        options: {
          foo: {
            default: 'oof',
          },
        },
        args: [['--foo']],
        expected: '--foo requires a value',
      },

      'understands choices': {
        options: {
          foo: {
            choices: ['oof'],
          },
        },
        args: [
          ['--foo', 'oof'],
        ],
        expected: {
          options: {
            foo: 'oof',
          },
          positionalArguments: []
        },
      },

      'errors if choice does not match': {
        options: {
          foo: {
            choices: ['oof'],
          },
          bar: {
            choices: ['rab1', 'rab2'],
          },
        },
        args: [
          ['--foo', 'oof'],
          ['--bar', 'rab'],
        ],
        expected: '--bar must be one of the values rab1,rab2',
      },

      'accepts unkown options': {
        options: {},
        args: [
          ['--foo'],
          ['--bar'],
          ['--bay', 'yab'],
          ['foo'],
          ['--b', 'zab1'],
          ['--foo', 'oof'],
          ['--b', 'zab2'],
          ['bar'],
        ],
        expected: {
          options: {
            foo: 'oof',
            bar: true,
            bay: 'yab',
            b: ['zab1', 'zab2'],
          },
          positionalArguments: ['foo', 'bar'],
        },
      },

      'parses unkown options as JSON': {
        options: {},
        args: [
          ['--foo', '{"foo": "bar"}'],
        ],
        expected: {
          options: {
            foo: {foo: 'bar'},
          },
          positionalArguments: [],
        },
      },
    });
  });

  describe('flags', function() {
    const parser = argsParser.options({
      foo: {
        abbr: 'f',
        full: 'foo',
        flag: true,
      },
      bar: {
        full: 'another-bar',
        flag: true,
        default: false,
      },
    });

    it('sets values to true of specified', function() {
      expect(parser.parse(['--foo', '--another-bar', 'foo', 'bar']))
        .toEqual({
          options: {
            foo: true,
            bar: true,
          },
          positionalArguments: ['foo', 'bar'],
        });
    });

    it('understands short options', function() {
      expect(parser.parse(['-f', '--another-bar', 'f', 'bar']))
        .toEqual({
          options: {
            foo: true,
            bar: true,
          },
          positionalArguments: ['f', 'bar'],
        });
    });

    it('sets default value if not specified', function() {
      expect(parser.parse(['f', 'bar']))
        .toEqual({
          options: {
            bar: false,
          },
          positionalArguments: ['f', 'bar'],
        });
    });

    it('accepts flag=0 and flag=1 (undocumented)', function() {
      expect(parser.parse(['--foo=0', '--another-bar=1']))
        .toEqual({
          options: {
            foo: false,
            bar: true,
          },
          positionalArguments: [],
        });
      expect(parser.parse(['-f=0']))
        .toEqual({
          options: {
            foo: false,
            bar: false,
          },
          positionalArguments: [],
        });
    });

    it('understands --no-prefixes', function() {
      expect(parser.parse(['--no-foo', '--no-another-bar']))
        .toEqual({
          options: {
            foo: false,
            bar: false,
          },
          positionalArguments: [],
        });
    });
  });

});

