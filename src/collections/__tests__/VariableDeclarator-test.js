
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const getParser = require('./../../getParser');

const recast = require('recast');
const types = recast.types.namedTypes;

describe('VariableDeclarators', function() {
  let nodes;
  let Collection;
  let VariableDeclaratorCollection;

  beforeEach(function() {
    jest.resetModuleRegistry();

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
      '}',
      'foo.bar();',
      'foo[bar]();',
      'bar.foo();',
      'function func() {',
      '  var blah;',
      '  var obj = {',
      '    blah: 4,',
      '    blah() {},',
      '  };',
      '  obj.blah = 3;',
      '  class A {',
      '    blah = 10',
      '    blah() {}',
      '  }',
      '}',
      '<Component foo={foo} />',
    ].join('\n'), {parser: getParser()}).program];
  });

  describe('Traversal', function() {
    it('adds a root method to find variable declarators', function() {
      expect(Collection.fromNodes([]).findVariableDeclarators).toBeDefined();
    });

    it('finds all variable declarators', function() {
      const declarators = Collection.fromNodes(nodes).findVariableDeclarators();
      expect(declarators.getTypes()).toContain('VariableDeclarator');
      expect(declarators.length).toBe(7);
    });

    it('finds variable declarators by name', function() {
      const declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators('bar');
      expect(declarators.length).toBe(2);
    });
  });

  describe('Filters', function() {
    it('finds module imports (require)', function() {
      const declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(VariableDeclaratorCollection.filters.requiresModule());

      expect(declarators.length).toBe(2);
    });

    it('finds module imports (require) by module name', function() {
      const declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(VariableDeclaratorCollection.filters.requiresModule('module'));

      expect(declarators.length).toBe(1);
    });

    it('accepts multiple module names', function() {
      const declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(VariableDeclaratorCollection.filters.requiresModule(
          ['module', 'module2']
        ));

      expect(declarators.length).toBe(2);
    });
  });

  describe('Transform', function() {
    it('renames variable declarations considering scope', function() {
      Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(VariableDeclaratorCollection.filters.requiresModule('module'))
        .renameTo('xyz');

      const identifiers =
        Collection.fromNodes(nodes)
        .find(types.Identifier, {name: 'xyz'});

      expect(identifiers.length).toBe(6);
    });

    it('does not rename things that are not variables', function() {
      Collection.fromNodes(nodes)
        .findVariableDeclarators('blah')
        .renameTo('blarg');

      const identifiers =
        Collection.fromNodes(nodes)
        .find(types.Identifier, {name: 'blarg'});

      expect(identifiers.length).toBe(1);
    });

    it('properly renames a shorthand property that was using the old variable name', function() {
      nodes = [recast.parse([
        'var foo = 42;',
        'var obj2 = {',
        '  foo,',
        '};',
      ].join('\n'), {parser: getParser()}).program];

      // Outputs:
      // var newFoo = 42;
      // var obj2 = {
      //   foo: newFoo,
      // };
      Collection.fromNodes(nodes)
        .findVariableDeclarators('foo').renameTo('newFoo');

      expect(
        Collection.fromNodes(nodes).find(types.Identifier, { name: 'newFoo' }).length
      ).toBe(2);
      expect(
        Collection.fromNodes(nodes).find(types.Identifier, { name: 'foo' }).length
      ).toBe(1);

      expect(
        Collection.fromNodes(nodes).find(types.Property).filter(prop => !prop.value.shorthand).length
      ).toBe(1);
      expect(
        Collection.fromNodes(nodes).find(types.Property).filter(prop => prop.value.shorthand).length
      ).toBe(0);
    });

    it('does not rename React component prop name', function () {
      Collection.fromNodes(nodes)
        .findVariableDeclarators('foo')
        .renameTo('xyz');

      const identifiers = Collection.fromNodes(nodes)
        .find(types.JSXIdentifier, { name: 'foo' });

      expect(identifiers.length).toBe(1);
    });
  });

});
