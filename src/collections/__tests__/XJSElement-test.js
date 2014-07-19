"use strict";

jest.autoMockOff();

var esprima = require('esprima-fb');

describe('XJSCollection API', function() {
  var nodes;
  var Collection;
  var XJSElementCollection;
  var recast;
  var types;
  var b;

  beforeEach(function() {
    Collection = require('../../Collection');
    XJSElementCollection = require('../XJSElement');
    recast = require('recast');
    types = recast.types.namedTypes;
    b = recast.types.builders;

    XJSElementCollection.register();

    nodes = [recast.parse([
      'var FooBar = require("XYZ");',
      '<FooBar foo="bar" bar="foo">',
      '  <Child id="1" foo="bar">',
      '     <Child />',
      '     <Baz.Bar />',
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

    it('finds XJSElements by module name', function() {
      var jsx = Collection.fromNodes(nodes).findXJSElementsByModuleName('XYZ');

      expect(jsx.size()).toBe(1);
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
    it('filters elements by attributes', function() {
      var jsx = Collection.fromNodes(nodes)
        .findXJSElements()
        .filter(XJSElementCollection.filters.hasAttributes({foo: "bar"}));
      expect(jsx.size()).toBe(2);
    });

    it('accepts callback functions as attribute filters', function() {
      var jsx = Collection.fromNodes(nodes)
        .findXJSElements()
        .filter(XJSElementCollection.filters.hasAttributes(
            {foo: v => ['bar', 'baz'].indexOf(v) > -1}
        ));
      expect(jsx.size()).toBe(3);
    });

    it('filters elements by children', function() {
      var jsx = Collection.fromNodes(nodes)
        .findXJSElements()
        .filter(XJSElementCollection.filters.hasChildren('Child'));
      expect(jsx.size()).toBe(2);
    });
  });

  describe('Mappings', function() {
    it('gets the root names of XJSElements', function() {
      var names = Collection.fromNodes(nodes)
        .findXJSElements()
        .paths().map(XJSElementCollection.mappings.getRootName);

      expect(names.indexOf('FooBar') > -1).toBe(true);
      expect(names.indexOf('Child') > -1).toBe(true);
      expect(names.indexOf('Baz') > -1).toBe(true);
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
        .childElements().at(1).insertBefore(newChildElement);

      expect(ast.children.length).toBe(6);
      expect(ast.children[3]).toBe(newChildElement);
    });

  });
});
