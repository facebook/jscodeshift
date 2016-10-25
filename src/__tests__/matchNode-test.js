/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*global jest, describe, it, expect, beforeEach*/

'use strict';

const matchNode = require('../matchNode');

describe('matchNode', function() {
  beforeEach(function() {
    jest.addMatchers({
      toMatchNode: function() {
        return {
          compare(haystack, needle) {
            const result = {};
            result.pass = matchNode(haystack, needle);
            return result;
          },
        };
      }
    });
  })

  it('matches null and undefined', function() {
    expect(null).toMatchNode(null);
    expect(null).not.toMatchNode(undefined);

    expect(undefined).toMatchNode(undefined);
    expect(undefined).not.toMatchNode(null);
  });

  it('matches scalars', function() {
    expect('foo').toMatchNode('foo');
    expect('foo').not.toMatchNode('bar');
    expect('123').not.toMatchNode(123);

    expect(123).toMatchNode(123);
    expect(123).not.toMatchNode(456);
    expect(123).not.toMatchNode('123');

    expect(true).toMatchNode(true);
    expect(true).not.toMatchNode(false);
    expect(true).not.toMatchNode('true');
  });

  it('matches arrays', function() {
    expect([1, 2, 3]).toMatchNode([1, 2, 3]);
    expect([1, 2, 3]).not.toMatchNode([4, 5, 6]);

    expect([[1, 2, 3], 'foo']).toMatchNode([[1, 2, 3], 'foo']);
    expect([[1, 2, 3], 'foo']).not.toMatchNode([[456], 'foo']);
    expect([[1, 2, 3], 'foo']).not.toMatchNode([[1, 2, 3], 'bar']);

    expect([1, 2, 3, 4]).toMatchNode([1, 2, 3]);
    expect([1, 2, 3]).not.toMatchNode([1, 2, 3, 4]);
  });

  it('matches objects', function() {
    expect({}).toMatchNode({});
    expect({name: 'foo'}).toMatchNode({name: 'foo'});
    expect({name: 'foo'}).not.toMatchNode({name: 'bar'});

    expect({name: 'foo', value: {name: 'bar'}})
      .toMatchNode({name: 'foo', value: {name: 'bar'}});
    expect({name: 'foo', value: {name: 'bar'}})
      .not.toMatchNode({name: 'foo', value: {name: 'baz'}});

    expect({name: 'foo', value: 'bar'}).toMatchNode({name: 'foo'});
    expect({name: 'foo'}).not.toMatchNode({name: 'foo', value: 'bar'});

    expect(Object.create({name: 'foo'})).not.toMatchNode({name: 'foo'});
    expect({}).toMatchNode(Object.create({name: 'foo'}));
  });

  it('matches with a function', function() {
    const haystack = {name: 'foo'};
    const needle = jest.genMockFunction();

    needle.mockReturnValue(true);
    expect(haystack).toMatchNode(needle);
    expect(needle).toBeCalledWith(haystack);

    needle.mockReturnValue(false);
    expect(haystack).not.toMatchNode(needle);
  });

  it('matches nested value with a function', function() {
    const haystack = {name: 'foo', value: 'bar'};
    const needle = {
      name: jest.genMockFunction(),
      value: jest.genMockFunction(),
    };

    needle.name.mockReturnValue(true);
    needle.value.mockReturnValue(true);
    expect(haystack).toMatchNode(needle);
    expect(needle.name).toBeCalledWith(haystack.name);
    expect(needle.value).toBeCalledWith(haystack.value);

    needle.name.mockReturnValue(false);
    needle.value.mockReturnValue(true);
    expect(haystack).not.toMatchNode(needle);

    needle.name.mockReturnValue(true);
    needle.value.mockReturnValue(false);
    expect(haystack).not.toMatchNode(needle);
  });
});
