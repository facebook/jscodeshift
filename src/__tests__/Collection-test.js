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


describe('Collection API', function() {
  let nodes;
  let Collection;
  let recast;
  let NodePath;
  let types;
  let b;

  beforeEach(function() {
    jest.resetModuleRegistry();

    Collection = require('../Collection');
    recast = require('recast');

    NodePath = recast.types.NodePath;
    types = recast.types.namedTypes;
    b = recast.types.builders;

    nodes = [b.identifier('foo'), b.identifier('bar')];
  });

  describe('Instantiation', function() {

    it('should create a collection from an array of nodes', function() {
      expect(Collection.fromNodes(nodes).getTypes()).toContain('Identifier');
    });

    it('should create a collection from an array of paths', function() {
      const paths = [
        new NodePath(b.identifier('foo')),
        new NodePath(b.identifier('bar')),
      ];
      expect(Collection.fromPaths(paths).getTypes()).toContain('Identifier');
    });

    it('accepts an empty array as input', function() {
      const values = [];
      expect(() => Collection.fromPaths(values)).not.toThrow();
      expect(() => Collection.fromNodes(values)).not.toThrow();
    });

    it('throws if it is passed an array of mixed values', function() {
      const values = [
        new NodePath(b.identifier('foo')),
        b.identifier('bar'),
      ];
      expect(() => Collection.fromPaths(values)).toThrow();
      expect(() => Collection.fromNodes(values)).toThrow();
    });

    it('returns a collection of the closest common type', function() {
      let nodes = [
        b.identifier('foo'),
        b.sequenceExpression([]),
      ];
      expect(Collection.fromNodes(nodes).getTypes())
        .toContain('Expression');

      nodes = [
        b.identifier('foo'),
        b.blockStatement([]),
      ];
      expect(Collection.fromNodes(nodes).getTypes())
        .toContain('Node');
    });
  });

  describe('Method extensions', function() {
    it('handles method extensions for types', function() {
      const Collection = require('../Collection');
      const getNames = jest.fn(function() {
        expect(this.nodes()).toEqual(nodes);
      });
      Collection.registerMethods({getNames: getNames}, types.Identifier);

      const collection = Collection.fromNodes(nodes);

      expect(collection.getNames).toBeDefined();
      collection.getNames();
      expect(getNames).toBeCalled();
    });

    it('throws if a method is called for the wrong node type', function() {
      const Collection = require('../Collection');
      const getNames = jest.genMockFunction();
      Collection.registerMethods({getNames: getNames}, types.Identifier);

      const collection = Collection.fromNodes([
        b.blockStatement([])
      ]);

      expect(() => collection.getNames()).toThrow();
    });

    it('adds "global" methods to all types', function() {
      const Collection = require('../Collection');
      const getNames = jest.genMockFunction();
      Collection.registerMethods({getNames: getNames});

      expect(Collection.fromNodes([b.blockStatement([])]).getNames).toBeDefined();
      expect(Collection.fromNodes(nodes).getNames).toBeDefined();
      expect(Collection.fromNodes([]).getNames).toBeDefined();
    });

    it('handles type inheritance chains', function() {
      const Collection = require('../Collection');
      const nodeMethod = function() {};
      const identifierMethod = function() {};
      Collection.registerMethods({nodeMethod: nodeMethod}, types.Node);
      Collection.registerMethods(
        {identifierMethod: identifierMethod},
        types.Identifier
      );

      const collection = Collection.fromNodes([b.identifier('foo')]);

      expect(() => collection.identifierMethod()).not.toThrow();
      expect(() => collection.nodeMethod()).not.toThrow();
    });

    it('handles type inheritance with multiple parents', function() {
      Collection.registerMethods(
        {expressionMethod: function() {}},
        types.Expression
      );
      const collection = Collection.fromNodes([
        b.functionExpression(null, [], b.blockStatement([]))
      ]);
      expect(() => collection.expressionMethod()).not.toThrow();
    });

    it('allows multiple registrations for non-conflicting types', function () {
      Collection.registerMethods(
        {foo: function () {}},
        types.FunctionExpression
      );

      Collection.registerMethods(
        {foo: function () {}},
        types.BinaryExpression
      );

      const collection = Collection.fromNodes([
        b.functionExpression(null, [], b.blockStatement([])),
        b.functionExpression(null, [], b.blockStatement([])),
        b.binaryExpression('+', b.identifier('a'), b.identifier('b'))
      ]);

      function typeFilter(type) {
        return function (path) {
          return type.check(path.value);
        };
      }

      // allowed if collection contents match one of the registered types.
      collection.filter(typeFilter(types.BinaryExpression)).foo();
      collection.filter(typeFilter(types.FunctionExpression)).foo();

      // not allowed if there is mixed types (even though all types match one function or the other).
      expect(function () {
        collection.foo();
      }).toThrow();
    });

    describe('hasConflictingRegistration', function () {
      function register(methodName, type) {
        const methods = {};
        methods[methodName] = function () {};
        if (!types[type]) {
          throw new Error(type + ' is not a valid type');
        }
        Collection.registerMethods(methods, types[type]);
      }

      it('true if supertype is registered', function () {
        register('supertypeIsRegistered', 'Expression');
        expect(Collection.hasConflictingRegistration('supertypeIsRegistered', 'FunctionExpression')).toBe(true);
      });

      it('true if subtype is registered', function () {
        register('subtypeIsRegistered', 'FunctionExpression');
        expect(Collection.hasConflictingRegistration('subtypeIsRegistered', 'Expression')).toBe(true);
      });

      it('false if only a sibling type is registered', function () {
        register('siblingIsRegistered', 'FunctionExpression');
        expect(Collection.hasConflictingRegistration('siblingIsRegistered', 'BinaryExpression')).toBe(false);
      });
    });
  });

  describe('Processing functions', function() {
    describe('filter', function() {
      it('lets you filter with custom logic', function() {
        const filter = jest.fn(function(path) {
          return path.value.name === 'foo';
        });
        const fooVariables = Collection.fromNodes(nodes).filter(filter);

        expect(filter.mock.calls.length).toBe(2);
        expect(fooVariables.length).toBe(1);
      });

    });

    describe('forEach', function() {
      it('lets you iterate over each element of an collection', function() {
        const each = jest.genMockFunction();
        Collection.fromNodes(nodes).forEach(each);

        expect(each.mock.calls.length).toBe(2);
        expect(each.mock.calls[0][0].value).toBe(nodes[0]);
        expect(each.mock.calls[1][0].value).toBe(nodes[1]);
      });

      it('returns the collection itself', function() {
        const fVariables = Collection.fromNodes(nodes);
        const result = fVariables.forEach(function(){});

        expect(result).toBe(fVariables);
      });
    });

    describe('map', function() {
      it('returns a new collection with mapped values', function() {
        const root = Collection.fromNodes(nodes);
        const mapped = root.map((_, i) => new NodePath(nodes[+!i]));

        expect(root).not.toBe(mapped);
        expect(mapped.length).toBe(2);
        expect(mapped.nodes()[0]).toBe(nodes[1]);
        expect(mapped.nodes()[1]).toBe(nodes[0]);
      });

      it('dedupes elements', function() {
        const path = new NodePath(nodes[0]);
        const root = Collection.fromNodes(nodes);
        const mapped = root.map(() => path);

        expect(root).not.toBe(mapped);
        expect(mapped.length).toBe(1);
        expect(mapped.paths()[0]).toBe(path);
      });
    });

    describe('at', function() {
      it('should work with positive indecies', function() {
        const root = Collection.fromNodes(nodes);
        expect(root.at(0).nodes()[0]).toEqual(nodes[0]);
        expect(root.at(1).nodes()[0]).toEqual(nodes[1]);
      });

      it('should work with negative indecies', function() {
        const root = Collection.fromNodes(nodes);
        expect(root.at(-1).nodes()[0]).toEqual(nodes[nodes.length - 1]);
        expect(root.at(-2).nodes()[0]).toEqual(nodes[nodes.length - 2]);
      });
    });

    describe('get', function() {
      it('should throw descriptive error when no paths are present', function() {
        const root = Collection.fromNodes([]);
        expect(() => root.get()).toThrowError(/cannot call "get" on a collection with no paths/);
      });
    });
  });
});
