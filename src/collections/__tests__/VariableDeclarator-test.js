"use strict";

jest.autoMockOff();

var esprima = require('esprima-fb');
var recast = require('recast');
var types = recast.types.namedTypes;
var b = recast.types.builders;


describe('VariableDeclarators', function() {
  var nodes;
  var Collection;
  var VariableDeclaratorCollection;

  beforeEach(function() {
    Collection = require('../../Collection');
    VariableDeclaratorCollection =  require('../VariableDeclarator');
    VariableDeclaratorCollection.register();

    nodes = [recast.parse([
      'var foo = 42;',
      'var bar = require("module");',
      'var baz = require("module2");',
      'function func() {',
      '  var x = bar;',
      '  bar.someMethod();',
      '  func1(bar);',
      '}',
      'function func1(bar) {',
      '  var bar = 21;',
      '}'].join('\n'), {esprima: esprima}).program];
  });

  describe('Traversal', function() {
    it('adds a root method to find variable declarators', function() {
      expect(Collection.fromNodes([]).findVariableDeclarators).toBeDefined();
    });

    it('finds all variable declarators', function() {
      var declarators = Collection.fromNodes(nodes).findVariableDeclarators();
      expect(declarators.constructor.name)
        .toContain('VariableDeclaratorCollection');
      expect(declarators.size()).toBe(5);
    });

    it('finds variable declarators by name', function() {
      var declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators('bar');
      expect(declarators.size()).toBe(2);
    });
  });
  
  describe('Filters', function() {
    it('finds module imports (require)', function() {
      var declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(VariableDeclaratorCollection.filterByRequire());

      expect(declarators.size()).toBe(2);
    });

    it('finds module imports (require) by module name', function() {
      var declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(VariableDeclaratorCollection.filterByRequire('module'));

      expect(declarators.size()).toBe(1);
    });
  });

  describe('Transform', function() {
    it('renames variable declarations considering scope', function() {
      var declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(VariableDeclaratorCollection.filterByRequire('module'))
        .renameTo('xyz');

      var identifiers =
        Collection.fromNodes(nodes)
        .find(types.Identifier, {name: 'xyz'});

      expect(identifiers.size()).toBe(4);
    });
  });

});
