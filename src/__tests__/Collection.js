"use strict";

jest.autoMockOff();

var recast = require('recast');
var Collection = require('../Collection');

var NodePath = recast.types.NodePath;
var types = recast.types.namedTypes;
var b = recast.types.builders;

describe('Collection API', function() {
  var nodes;

  beforeEach(function() {
    nodes = [b.identifier('foo'), b.identifier('bar')];
  });

  describe('Instantiation', function() {
    it('should create a collection from an array of nodes', function() {
      expect(Collection.fromNodes(nodes).constructor.name).toBe('IdentifierCollection');
    });

    it('should create a collection from an array of paths', function() {
      var paths = [
        new NodePath(b.identifier('foo')),
        new NodePath(b.identifier('bar')),
      ];
      expect(Collection.fromPaths(paths).constructor.name).toBe('IdentifierCollection');
    });

    it('accepts an empty array as input', function() {
      var values = [];
      expect(Collection.fromPaths(values).constructor.name).toBe('Collection');
      expect(Collection.fromNodes(values).constructor.name).toBe('Collection');
    });

    it('throws if it is passed an array of mixed values', function() {
      var values = [
        new NodePath(b.identifier('foo')),
        b.identifier('bar'),
      ];
      expect(_ => Collection.fromPaths(values)).toThrow();
      expect(_ => Collection.fromNodes(values)).toThrow();
    });

    it('returns a collection of the closest common type', function() {
      var nodes = [
        b.identifier('foo'),
        b.sequenceExpression([]),
      ];
      expect(Collection.fromNodes(nodes).constructor.name)
        .toBe('ExpressionCollection');

      nodes = [
        b.identifier('foo'),
        b.blockStatement([]),
      ];
      expect(Collection.fromNodes(nodes).constructor.name)
        .toBe('NodeCollection');
    });
  });

  describe('Method extensions', function() {
    it('handles method extensions for types', function() {
      var Collection = require('../Collection');
      var getNames = jest.genMockFunction().mockImpl(function() {
        expect(this.nodes()).toEqual(nodes);
      });
      Collection.registerMethods({getNames: getNames}, types.Identifier);

      var collection = Collection.fromNodes(nodes);

      expect(collection.getNames).toBeDefined();
      expect(collection.getNames).toBe(getNames);
      collection.getNames();
      expect(collection.getNames).toBeCalled();
    });

    it('doesn\'t add specific type methods to other types', function() {
      var Collection = require('../Collection');
      var getNames = jest.genMockFunction();
      Collection.registerMethods({getNames: getNames}, types.Identifier);

      var collection = Collection.fromNodes([
        b.blockStatement([])
      ]);

      expect(collection.getNames).toBeUndefined();
    });

    it('ads "global" methods to all types', function() {
      var Collection = require('../Collection');
      var getNames = jest.genMockFunction();
      Collection.registerMethods({getNames: getNames});

      expect(Collection.fromNodes([b.blockStatement([])])).toBeDefined();
      expect(Collection.fromNodes(nodes)).toBeDefined();
      expect(Collection.fromNodes([])).toBeDefined();
    });

    it('handles type inheritance chains', function() {
      var Collection = require('../Collection');
      var nodeMethod = function() {};
      var identifierMethod = function() {};
      Collection.registerMethods({nodeMethod: nodeMethod}, types.Node);
      Collection.registerMethods(
        {identifierMethod: identifierMethod},
        types.Identifier
      );

      var collection = Collection.fromNodes([b.identifier('foo')]);

      expect(collection.identifierMethod).toBeDefined();
      expect(collection.nodeMethod).toBeDefined();
    });
  });

  describe('Processing functions', function() {
    describe('filter', function() {
      it('lets you filter with custom logic', function() {
        var filter = jest.genMockFunction().mockImplementation(function(path) {
          return path.value.name === 'foo';
        });
        var fooVariables = Collection.fromNodes(nodes).filter(filter);

        expect(filter.mock.calls.length).toBe(2);
        expect(fooVariables.size()).toBe(1);
      });

    });

    describe('forEach', function() {
      it('lets you iterate over each element of an collection', function() {
        var each = jest.genMockFunction();
        var fVariables = Collection.fromNodes(nodes).forEach(each);

        expect(each.mock.calls.length).toBe(2);
        expect(each.mock.calls[0][0].value).toBe(nodes[0]);
        expect(each.mock.calls[1][0].value).toBe(nodes[1]);
      });

      it('returns the collection itself', function() {
        var fVariables = Collection.fromNodes(nodes);
        var result = fVariables.forEach(function(){});

        expect(result).toBe(fVariables);
      });
    });
  });
});
