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

describe('Collection API', function() {
  var ast;
  var Collection;
  var NodeCollection;
  var recast;
  var NodePath;
  var types;
  var b;

  beforeEach(function() {
    Collection = require('../../Collection');
    NodeCollection = require('../Node');
    recast = require('recast');

    NodePath = recast.types.NodePath;
    types = recast.types.namedTypes;
    b = recast.types.builders;

    NodeCollection.register();

    ast = b.program([
      b.variableDeclaration(
        'var',
        [b.variableDeclarator(b.identifier('foo'), null)]
      ),
      b.functionDeclaration(
        b.identifier('f'),
        [],
        b.blockStatement([
          b.variableDeclaration(
            'var',
            [b.variableDeclarator(b.identifier('bar'), null)]
          ),
          b.variableDeclaration(
            'var',
            [b.variableDeclarator(b.identifier('baz'), null)]
          )
        ])
      ),
    ]);
  });

  describe('Traversal', function() {
    describe('find', function() {
      it('finds nodes by type', function() {
        var ast = b.sequenceExpression([
          b.identifier('foo'),
          b.literal("asd"),
          b.identifier('bar'),
        ]);
        var vars = Collection.fromNodes([ast]).find(types.Identifier);

        expect(vars.size()).toBe(2);
      });

      it('doesn\'t find the nodes in the collection itself', function() {
        var nodes = [
          b.identifier('foo'),
          b.literal("asd"),
          b.identifier('bar'),
        ];
        var vars = Collection.fromNodes(nodes).find(types.Identifier);

        expect(vars.size()).toBe(0);
      });

      it('finds nodes by type and properties', function() {
        var ast = b.sequenceExpression([
          b.identifier('foo'),
          b.literal("asd"),
          b.identifier('bar'),
        ]);
        var vars = Collection.fromNodes([ast])
          .find(types.Identifier, {name: 'bar'});

        expect(vars.size()).toBe(1);
        expect(vars.nodes()[0]).toBe(ast.expressions[2]);
      });

      it('handles chained find calls properly', function() {
        var vars = Collection.fromNodes([ast])
          .find(types.FunctionDeclaration)
          .find(types.VariableDeclarator, {id: {name: 'bar'}});

        expect(vars.size()).toBe(1);
        expect(vars.nodes()[0]).toBe(
          ast.body[1].body.body[0].declarations[0]
        );
      });

      it('handles multi chain find calls properly', function() {
        var functionBody = ast.body[1].body.body;
        var functionDeclarations = Collection.fromNodes([ast])
          .find(types.FunctionDeclaration);

        var bar = functionDeclarations
          .find(types.VariableDeclarator, {id: {name: 'bar'}});
        var baz = functionDeclarations
          .find(types.VariableDeclarator, {id: {name: 'baz'}});

        expect(bar.size()).toBe(1);
        expect(bar.nodes()[0]).toBe(functionBody[0].declarations[0]);
        expect(baz.size()).toBe(1);
        expect(baz.nodes()[0]).toBe(functionBody[1].declarations[0]);
      });
    });

    describe('closestScope', function() {
      it('gets the closest scope', function() {
        var program = ast;
        var functionDeclaration = ast.body[1];
        var scopes = Collection.fromNodes([ast])
          .find(types.Identifier)
          .closestScope();

        expect(scopes.nodes()[0]).toBe(ast);
        expect(scopes.nodes()[1]).toBe(functionDeclaration);
      });
    });

    describe('closest', function() {
      it('finds closest node (up the tree) of the given type', function() {
        var functionDeclaration = ast.body[1];
        var decl = Collection.fromNodes([ast])
          .find(types.Identifier)
          .closest(types.FunctionDeclaration);

        expect(decl.size()).toBe(1);
        expect(decl.nodes()[0]).toBe(functionDeclaration);
      });

      it('allows to filter nodes', function() {
        var functionDeclaration = ast.body[1];
        var decl = Collection.fromNodes([ast])
          .find(types.Identifier, {name: 'f'})
          .closest(types.FunctionDeclaration);

        expect(decl.size()).toBe(1);
        expect(decl.nodes()[0]).toBe(functionDeclaration);

        decl = Collection.fromNodes([ast])
          .find(types.Identifier, {name: 'foo'})
          .closest(types.FunctionDeclaration);

        expect(decl.size()).toBe(0);
      });
    });

    describe('getVariableDeclarators', function() {
      it('gets the variable declarators for each selected path', function() {
        var variableDeclarator =
          b.variableDeclarator(b.identifier('foo'), null);
        var program = b.program([
          b.variableDeclaration('var', [variableDeclarator]),
          b.expressionStatement(b.identifier('foo')),
          b.expressionStatement(b.identifier('bar'))
        ]);

        var decl = Collection.fromNodes([program])
          .find(types.Identifier)
          .getVariableDeclarators(p => p.value.name);
        expect(decl.size()).toBe(1);
        expect(decl.nodes()[0]).toBe(variableDeclarator);
      });
    });
  });

  describe('Mutation', function() {
    describe('replaceWith', function() {
      it('handles simple AST node replacement', function() {
        var ast = b.sequenceExpression([
          b.identifier('foo'),
          b.literal("asd"),
          b.identifier('bar'),
        ]);
        var newNode = b.identifier('xyz');

        var S = Collection.fromNodes([ast]);
        S.find(types.Identifier, {name: 'bar'})
          .replaceWith(newNode);

        expect(S.nodes()[0].expressions[2]).toBe(newNode);
      });

      it('accepts an array as replacement', function() {
        var ast = b.sequenceExpression([
          b.identifier('foo'),
          b.literal("asd"),
          b.identifier('bar'),
        ]);
        var newNode1 = b.identifier('xyz');
        var newNode2 = b.identifier('jkl');

        var S = Collection.fromNodes([ast]);
        S.find(types.Identifier, {name: 'bar'})
          .replaceWith([newNode1, newNode2]);

        expect(S.nodes()[0].expressions[2]).toBe(newNode1);
        expect(S.nodes()[0].expressions[3]).toBe(newNode2);
      });

      it('accepts a function as replacement ', function() {
        var ast = b.sequenceExpression([
          b.identifier('foo'),
          b.literal("asd"),
          b.identifier('bar'),
        ]);

        var expectedArgs = [b.identifier('foo'), b.identifier('bar')];
        var receivedArgs = [];
        var replaceFunction =
          jest.genMockFunction().mockImplementation(function(path, i) {
            // We have to keep a reference to the argument before it gets
            // replaced
            receivedArgs.push(path.value);
            return b.identifier(path.value.name + i);
          });

        var newNode = b.variableDeclarator(b.identifier('xyz'), null);
        var S = Collection.fromNodes([ast]);
        S.find(types.Identifier)
         .replaceWith(replaceFunction);

        expect(replaceFunction.mock.calls.length).toBe(2);
        expect(receivedArgs).toEqual(expectedArgs);
        // baz is properly replaced
        expect(S.nodes()[0].expressions[0]).toEqual(b.identifier('foo0'));
        // baz1 is properly replaced
        expect(S.nodes()[0].expressions[2]).toEqual(b.identifier('bar1'));
      });
    });

    describe('insertBefore', function() {
      it('inserts a new node before the current one', function() {
        var ast = b.variableDeclaration(
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        var one = b.variableDeclarator(b.identifier('one'), null);

        var S = Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertBefore(one);

        expect(ast.declarations.length).toBe(2);
        expect(ast.declarations[0]).toBe(one);
      });

      it('accepts an array of nodes', function() {
        var ast = b.variableDeclaration(
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        var one = b.variableDeclarator(b.identifier('one'), null);
        var two = b.variableDeclarator(b.identifier('two'), null);

        var S = Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertBefore([one, two]);

        expect(ast.declarations.length).toBe(3);
        expect(ast.declarations[0]).toBe(one);
        expect(ast.declarations[1]).toBe(two);
      });

      it('accepts a function', function() {
        var x = b.identifier('x');
        var foo = b.identifier('foo');
        var bar = b.identifier('bar');
        var ast = b.sequenceExpression([foo, bar]);

        var S = Collection.fromNodes([ast])
          .find(types.Identifier)
          .insertBefore(function() {
            return x;
          });

        expect(ast.expressions.length).toBe(4);
        expect(ast.expressions).toEqual([x, foo, x, bar]);
        expect(ast.expressions[0]).toBe(x);
        expect(ast.expressions[2]).toBe(x);
      });
    });

    describe('insertAfter', function() {
      it('inserts a new node after the current one', function() {
        var ast = b.variableDeclaration(
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        var one = b.variableDeclarator(b.identifier('one'), null);

        var S = Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertAfter(one);

        expect(ast.declarations.length).toBe(2);
        expect(ast.declarations[1]).toBe(one);
      });

      it('accepts an array of nodes', function() {
        var ast = b.variableDeclaration(
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        var one = b.variableDeclarator(b.identifier('one'), null);
        var two = b.variableDeclarator(b.identifier('two'), null);

        var S = Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertAfter([one, two]);

        expect(ast.declarations.length).toBe(3);
        expect(ast.declarations[1]).toBe(one);
        expect(ast.declarations[2]).toBe(two);
      });

      it('accepts a function', function() {
        var x = b.identifier('x');
        var foo = b.identifier('foo');
        var bar = b.identifier('bar');
        var ast = b.sequenceExpression([foo, bar]);

        var S = Collection.fromNodes([ast])
          .find(types.Identifier)
          .insertAfter(function() {
            return x;
          });

        expect(ast.expressions.length).toBe(4);
        expect(ast.expressions).toEqual([foo, x, bar, x]);
        expect(ast.expressions[1]).toBe(x);
        expect(ast.expressions[3]).toBe(x);
      });
    });
  });
});
