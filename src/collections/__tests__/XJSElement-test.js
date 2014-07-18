"use strict";

jest.autoMockOff();

var Collection = require('../../Collection');
var XJSElementCollection = require('../XJSElement');
var esprima = require('esprima-fb');
var recast = require('recast');
var types = recast.types.namedTypes;
var b = recast.types.builders;

XJSElementCollection.register();

describe('XJSCollection API', function() {
  var nodes;

  beforeEach(function() {
    nodes = [recast.parse([
      '<FooBar foo="bar" bar="foo">',
      '  <Child id="1" foo="bar">',
      '     <Child />',
      '  </Child>',
      '  <Child id="2" foo="baz"/>',
      '</FooBar>'
    ].join('\n'), {esprima: esprima}).program];
  });

  describe('Traversal', function() {

    it('returns a non empty XJSCollection', function() {
      var jsx = Collection.fromNodes(nodes).find(types.XJSElement);
      expect(jsx.constructor.name).toContain('XJSElementCollection');
      expect(jsx.size()).toBeGreaterThan(0);
    });

    it('lets us find XJSElements by name conveniently', function() {
      var jsx = Collection.fromNodes(nodes).findXJSElements('Child');

      expect(jsx.size()).toBe(3);
    });

    it('returns the child nodes of an XJSElement', function() {
      var children =
        Collection.fromNodes(nodes)
        .findXJSElements('FooBar')
        .childNodes();
      expect(children.size()).toBe(5);
      expect(children.constructor.name).toContain('ExpressionCollection');
    });

    it('returns the child XJSElements of an XJSElement', function() {
      var children =
        Collection.fromNodes(nodes)
        .findXJSElements('FooBar')
        .childElements();

      expect(children.size()).toBe(2);
      expect(children.constructor.name).toContain('XJSElementCollection');
    });

    it('returns a properly typed collection even if empty', function() {
      var children =
        Collection.fromNodes([])
        .findXJSElements('Foo')
        .childElements();

      expect(children.size()).toBe(0);
      expect(children.constructor.name).toContain('XJSElementCollection');
    });
  });

  describe('Filtering', function() {
    it('filters elements by attribute', function() {
      var jsx = Collection.fromNodes(nodes)
        .findXJSElements()
        .filter(XJSElementCollection.filters.filterByAttributes({foo: "bar"}));
      expect(jsx.size()).toBe(2);
    });

    it('filters elements by children', function() {
      var jsx = Collection.fromNodes(nodes)
        .findXJSElements()
        .filter(XJSElementCollection.filters.filterByHasChildren('Child'));
      expect(jsx.size()).toBe(2);
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
