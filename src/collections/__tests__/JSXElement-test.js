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

jest.autoMockOff();

var babel = require('babel-core');

describe('JSXCollection API', function() {
  var nodes;
  var Collection;
  var JSXElementCollection;
  var recast;
  var types;
  var b;

  beforeEach(function() {
    Collection = require('../../Collection');
    JSXElementCollection = require('../JSXElement');
    recast = require('recast');
    types = recast.types.namedTypes;
    b = recast.types.builders;

    JSXElementCollection.register();

    nodes = [recast.parse([
      'var FooBar = require("XYZ");',
      '<FooBar foo="bar" bar="foo">',
      '  <Child id="1" foo="bar">',
      '     <Child />',
      '     <Baz.Bar />',
      '  </Child>',
      '  <Child id="2" foo="baz"/>',
      '</FooBar>'
    ].join('\n'), {parser: babel}).program];
  });

  describe('Traversal', function() {
    it('returns a non empty JSXCollection', function() {
      var jsx = Collection.fromNodes(nodes).find(types.JSXElement);
      expect(jsx.getTypes()).toContain('JSXElement');
      expect(jsx.size()).toBeGreaterThan(0);
    });

    it('lets us find JSXElements by name conveniently', function() {
      var jsx = Collection.fromNodes(nodes).findJSXElements('Child');

      expect(jsx.size()).toBe(3);
    });

    it('finds JSXElements by module name', function() {
      var jsx = Collection.fromNodes(nodes).findJSXElementsByModuleName('XYZ');

      expect(jsx.size()).toBe(1);
    });

    it('returns the child nodes of an JSXElement', function() {
      var children =
        Collection.fromNodes(nodes)
        .findJSXElements('FooBar')
        .childNodes();
      expect(children.size()).toBe(5);
      expect(children.getTypes()).toContain('Expression');
    });

    it('returns the child JSXElements of an JSXElement', function() {
      var children =
        Collection.fromNodes(nodes)
        .findJSXElements('FooBar')
        .childElements();

      expect(children.size()).toBe(2);
      expect(children.getTypes()).toContain('JSXElement');
    });

    it('returns a properly typed collection even if empty', function() {
      var children =
        Collection.fromNodes([])
        .findJSXElements('Foo')
        .childElements();

      expect(children.size()).toBe(0);
      expect(children.getTypes()).toContain('JSXElement');
    });
  });

  describe('Filtering', function() {
    it('filters elements by attributes', function() {
      var jsx = Collection.fromNodes(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filters.hasAttributes({foo: "bar"}));
      expect(jsx.size()).toBe(2);
    });

    it('accepts callback functions as attribute filters', function() {
      var jsx = Collection.fromNodes(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filters.hasAttributes(
            {foo: v => ['bar', 'baz'].indexOf(v) > -1}
        ));
      expect(jsx.size()).toBe(3);
    });

    it('filters elements by children', function() {
      var jsx = Collection.fromNodes(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filters.hasChildren('Child'));
      expect(jsx.size()).toBe(2);
    });
  });

  describe('Mappings', function() {
    it('gets the root names of JSXElements', function() {
      var names = Collection.fromNodes(nodes)
        .findJSXElements()
        .paths().map(JSXElementCollection.mappings.getRootName);

      expect(names.indexOf('FooBar') > -1).toBe(true);
      expect(names.indexOf('Child') > -1).toBe(true);
      expect(names.indexOf('Baz') > -1).toBe(true);
    });
  });

  describe('Mutation', function() {
    it('handles insertions before children correctly', function() {
      var childElement = b.jsxElement(
        b.jsxOpeningElement(b.jsxIdentifier('Bar'), [], true)
      );
      var newChildElement = b.jsxElement(
        b.jsxOpeningElement(b.jsxIdentifier('Baz'), [], true)
      );
      var literal = b.literal('\n  ');
      var ast = b.jsxElement(
        b.jsxOpeningElement(b.jsxIdentifier('Foo')),
        b.jsxClosingElement(b.jsxIdentifier('Foo')),
        [literal, childElement, literal, childElement, b.literal('\n')]
      );

      var children = Collection.fromNodes([ast])
        .childElements().at(1).insertBefore(newChildElement);

      expect(ast.children.length).toBe(6);
      expect(ast.children[3]).toBe(newChildElement);
    });

  });
});
