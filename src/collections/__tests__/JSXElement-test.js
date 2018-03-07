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

const getParser = require('./../../getParser');

describe('JSXCollection API', function() {
  let nodes;
  let Collection;
  let JSXElementCollection;
  let recast;
  let types;
  let b;

  beforeEach(function() {
    jest.resetModuleRegistry();

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
    ].join('\n'), {parser: getParser()}).program];
  });

  describe('Traversal', function() {
    it('returns a non empty JSXCollection', function() {
      const jsx = Collection.fromNodes(nodes).find(types.JSXElement);
      expect(jsx.getTypes()).toContain('JSXElement');
      expect(jsx.length).toBeGreaterThan(0);
    });

    it('lets us find JSXElements by name conveniently', function() {
      const jsx = Collection.fromNodes(nodes).findJSXElements('Child');

      expect(jsx.length).toBe(3);
    });

    it('finds JSXElements by module name', function() {
      const jsx = Collection.fromNodes(nodes).findJSXElementsByModuleName('XYZ');

      expect(jsx.length).toBe(1);
    });

    it('returns the child nodes of an JSXElement', function() {
      const children =
        Collection.fromNodes(nodes)
        .findJSXElements('FooBar')
        .childNodes();
      expect(children.length).toBe(5);
      expect(children.getTypes()).toContain('Expression');
    });

    it('returns the child JSXElements of an JSXElement', function() {
      const children =
        Collection.fromNodes(nodes)
        .findJSXElements('FooBar')
        .childElements();

      expect(children.length).toBe(2);
      expect(children.getTypes()).toContain('JSXElement');
    });

    it('returns a properly typed collection even if empty', function() {
      const children =
        Collection.fromNodes([])
        .findJSXElements('Foo')
        .childElements();

      expect(children.length).toBe(0);
      expect(children.getTypes()).toContain('JSXElement');
    });
  });

  describe('Filtering', function() {
    it('filters elements by attributes', function() {
      const jsx = Collection.fromNodes(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filters.hasAttributes({foo: 'bar'}));
      expect(jsx.length).toBe(2);
    });

    it('accepts callback functions as attribute filters', function() {
      const jsx = Collection.fromNodes(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filters.hasAttributes(
            {foo: v => ['bar', 'baz'].indexOf(v) > -1}
        ));
      expect(jsx.length).toBe(3);
    });

    it('filters elements by children', function() {
      const jsx = Collection.fromNodes(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filters.hasChildren('Child'));
      expect(jsx.length).toBe(2);
    });
  });

  describe('Mappings', function() {
    it('gets the root names of JSXElements', function() {
      const names = Collection.fromNodes(nodes)
        .findJSXElements()
        .paths().map(JSXElementCollection.mappings.getRootName);

      expect(names.indexOf('FooBar') > -1).toBe(true);
      expect(names.indexOf('Child') > -1).toBe(true);
      expect(names.indexOf('Baz') > -1).toBe(true);
    });
  });

  describe('Mutation', function() {
    it('handles insertions before children correctly', function() {
      const childElement = b.jsxElement(
        b.jsxOpeningElement(b.jsxIdentifier('Bar'), [], true)
      );
      const newChildElement = b.jsxElement(
        b.jsxOpeningElement(b.jsxIdentifier('Baz'), [], true)
      );
      const literal = b.literal('\n  ');
      const ast = b.jsxElement(
        b.jsxOpeningElement(b.jsxIdentifier('Foo')),
        b.jsxClosingElement(b.jsxIdentifier('Foo')),
        [literal, childElement, literal, childElement, b.literal('\n')]
      );

      Collection.fromNodes([ast])
        .childElements().at(1).insertBefore(newChildElement);

      expect(ast.children.length).toBe(6);
      expect(ast.children[3]).toBe(newChildElement);
    });

  });
});
