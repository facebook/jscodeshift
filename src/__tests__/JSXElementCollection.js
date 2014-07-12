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
  var ast;

  beforeEach(function() {
    ast = recast.parse([
      '<FooBar foo="bar" bar="foo">',
      '  <Child id="1" />',
      '  <Child id="2" foo="bar"><Child /></Child>',
      '  <Child id="3" foo="baz"/>',
      '</FooBar>'
    ].join('\n'), {esprima: esprima}).program.body;
  });

  describe('selection', function() {

    it('returns a non empty JSXCollection', function() {
      var jsx = Collection.create(ast).find(types.XJSElement);
      expect(jsx instanceof JSXElementCollection).toBe(true);
      expect(jsx.size() > 0).toBe(true);
    });

    it('lets us find JSXElements by name conveniently', function() {
      var jsx = core(ast).findJSXElements('Child');

      expect(jsx.size()).toBe(4);
    });

    it('filters elements by attribute', function() {
      var jsx = core(ast)
        .findJSXElements()
        .filter(JSXElementCollection.filterByAttributes({foo: "bar"}));
      expect(jsx.size()).toBe(2);
    });

    it('filters elements by children', function() {
      var jsx = core(ast)
        .findJSXElements()
        .filter(JSXElementCollection.filterByHasChildren('Child'));
      expect(jsx.size()).toBe(2);
    });

  });

  describe('reorder child nodes', function() {

    xit('reorders element nodes', function() {
      var jsx = core(ast)
        .findJSXElements('FooBar')
        .reorderChildElementNodes({0: 2, 2: 0});
      expect(ast[0].children[1].openingElement.attributes[0].value).toBe("3");
      expect(ast[0].children[5].openingElement.attributes[0].value).toBe("1");
    });

  });
});
