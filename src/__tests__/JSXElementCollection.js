"use strict";

jest.autoMockOff();

var Collection = require('../Collection');
var JSXElementCollection = require('../JSXElementCollection');
var core = require('../core');
var esprima = require('esprima-fb');
var recast = require('recast');
var types = recast.types.namedTypes;
var b = recast.types.builders;

describe('JSXCollection API', function() {
  var nodes;

  beforeEach(function() {
    nodes = [recast.parse([
      '<FooBar foo="bar" bar="foo">',
      '  <Child id="1" />',
      '  <Child id="2" foo="bar">',
      '     <Child />',
      '  </Child>',
      '  <Child id="3" foo="baz"/>',
      '</FooBar>'
    ].join('\n'), {esprima: esprima}).program];
  });

  describe('Traversal', function() {

    it('returns a non empty JSXCollection', function() {
      var jsx = Collection.fromNodes(nodes).find(types.XJSElement);
      expect(jsx instanceof JSXElementCollection).toBe(true);
      expect(jsx.size()).toBeGreaterThan(0);
    });

    it('lets us find JSXElements by name conveniently', function() {
      var jsx = core(nodes).findJSXElements('Child');

      expect(jsx.size()).toBe(4);
    });

    it('filters elements by attribute', function() {
      var jsx = core(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filterByAttributes({foo: "bar"}));
      expect(jsx.size()).toBe(2);
    });

    it('filters elements by children', function() {
      var jsx = core(nodes)
        .findJSXElements()
        .filter(JSXElementCollection.filterByHasChildren('Child'));
      expect(jsx.size()).toBe(2);
    });

    it('returns the child nodes of an JSXElement', function() {
      var childElement = b.xjsElement(
        b.xjsOpeningElement(b.xjsIdentifier('Bar'), [], true)
      );
      var literal = b.literal('\n  ');
      var ast = b.xjsElement(
        b.xjsOpeningElement(b.xjsIdentifier('Foo')),
        b.xjsClosingElement(b.xjsIdentifier('Foo')),
        [literal, childElement, literal, childElement, b.literal('\n')]
      );

      var children = Collection.fromNodes([ast]).childNodes();
      expect(children.size()).toBe(5);
      expect(children instanceof Collection).toBe(true);
    });

    it('returns the child JSXElements of an JSXElement', function() {
      var childElement = b.xjsElement(
        b.xjsOpeningElement(b.xjsIdentifier('Bar'), [], true)
      );
      var literal = b.literal('\n  ');
      var ast = b.xjsElement(
        b.xjsOpeningElement(b.xjsIdentifier('Foo')),
        b.xjsClosingElement(b.xjsIdentifier('Foo')),
        [literal, childElement, literal, childElement, b.literal('\n')]
      );

      var children = Collection.fromNodes([ast]).childElements();

      expect(children.size()).toBe(2);
      expect(children instanceof JSXElementCollection).toBe(true);
    });

  });

  describe('Mutation', function() {

    it('handles insertions before children correctly', function() {
      var childElement = b.xjsElement(
        b.xjsOpeningElement(b.xjsIdentifier('Bar'), [], true)
      );
      var newChildElement = b.xjsElement(
        b.xjsOpeningElement(b.xjsIdentifier('Baz'), [], true)
      );
      var literal = b.literal('\n  ');
      var ast = b.xjsElement(
        b.xjsOpeningElement(b.xjsIdentifier('Foo')),
        b.xjsClosingElement(b.xjsIdentifier('Foo')),
        [literal, childElement, literal, childElement, b.literal('\n')]
      );

      var children = Collection.fromNodes([ast])
        .childElements().get(1).insertBefore(newChildElement);

      expect(ast.children.length).toBe(6);
      expect(ast.children[3]).toBe(newChildElement);
    });

  });
});
