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
  let ast;
  let Collection;
  let NodeCollection;
  let recast;
  let types;
  let b;

  beforeEach(function() {
    jest.resetModuleRegistry();

    Collection = require('../../Collection');
    NodeCollection = require('../Node');
    recast = require('recast');

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
        const ast = b.sequenceExpression([ // eslint-disable-line no-shadow
          b.identifier('foo'),
          b.literal('asd'),
          b.identifier('bar'),
        ]);
        const vars = Collection.fromNodes([ast]).find(types.Identifier);

        expect(vars.length).toBe(2);
      });

      it('doesn\'t find the nodes in the collection itself', function() {
        const nodes = [
          b.identifier('foo'),
          b.literal('asd'),
          b.identifier('bar'),
        ];
        const vars = Collection.fromNodes(nodes).find(types.Identifier);

        expect(vars.length).toBe(0);
      });

      it('finds nodes by type and properties', function() {
        const ast = b.sequenceExpression([ // eslint-disable-line no-shadow
          b.identifier('foo'),
          b.literal('asd'),
          b.identifier('bar'),
        ]);
        const vars = Collection.fromNodes([ast])
          .find(types.Identifier, {name: 'bar'});

        expect(vars.length).toBe(1);
        expect(vars.nodes()[0]).toBe(ast.expressions[2]);
      });

      it('handles chained find calls properly', function() {
        const vars = Collection.fromNodes([ast])
          .find(types.FunctionDeclaration)
          .find(types.VariableDeclarator, {id: {name: 'bar'}});

        expect(vars.length).toBe(1);
        expect(vars.nodes()[0]).toBe(
          ast.body[1].body.body[0].declarations[0]
        );
      });

      it('handles multi chain find calls properly', function() {
        const functionBody = ast.body[1].body.body;
        const functionDeclarations = Collection.fromNodes([ast])
          .find(types.FunctionDeclaration);

        const bar = functionDeclarations
          .find(types.VariableDeclarator, {id: {name: 'bar'}});
        const baz = functionDeclarations
          .find(types.VariableDeclarator, {id: {name: 'baz'}});

        expect(bar.length).toBe(1);
        expect(bar.nodes()[0]).toBe(functionBody[0].declarations[0]);
        expect(baz.length).toBe(1);
        expect(baz.nodes()[0]).toBe(functionBody[1].declarations[0]);
      });
    });

    describe('closestScope', function() {
      it('gets the closest scope', function() {
        const functionDeclaration = ast.body[1];
        const scopes = Collection.fromNodes([ast])
          .find(types.Identifier)
          .closestScope();

        expect(scopes.nodes()[0]).toBe(ast);
        expect(scopes.nodes()[1]).toBe(functionDeclaration);
      });
    });

    describe('closest', function() {
      let decl;
      beforeEach(()=> {
        decl = b.functionDeclaration(
          b.identifier('foo'),
          [],
          b.blockStatement([
            b.functionDeclaration(
              b.identifier('bar'),
              [],
              b.blockStatement([
                b.returnStatement(
                  b.literal(3)
                )
              ])
            ),
          ])
        );
      });

      it('finds closest node (up the tree) of the given type', function() {
        const functionDeclaration = ast.body[1];
        decl = Collection.fromNodes([ast])
          .find(types.Identifier)
          .closest(types.FunctionDeclaration);

        expect(decl.length).toBe(1);
        expect(decl.nodes()[0]).toBe(functionDeclaration);
      });

      it('allows to filter nodes by pattern', function() {
        const literals = Collection.fromNodes([decl])
          .find(types.Literal);
        expect(literals.get(0).node.value).toBe(3);
        const closest = literals.closest(
          types.FunctionDeclaration,
          {id: {name: 'foo'}}
        );
        expect(closest.get(0).node.id.name).toBe('foo');
      });

      it('allows to filter nodes with a filter function', function() {
        const literals = Collection.fromNodes([decl])
          .find(types.Literal);
        expect(literals.get(0).node.value).toBe(3);
        const closest = literals.closest(
          types.FunctionDeclaration,
          (node) => node.id && node.id.name === 'foo'
        );
        expect(closest.get(0).node.id.name).toBe('foo');
      });

      it('fails when filter evaluates as false', function() {
        const literals = Collection.fromNodes([decl])
          .find(types.Literal);
        expect(literals.get(0).node.value).toBe(3);
        const closest = literals.closest(
          types.FunctionDeclaration,
          (node) => node.id && node.id.name === 'blue'
        );
        expect(closest.nodes().length).toBe(0);
      });
    });

    describe('getVariableDeclarators', function() {
      it('gets the variable declarators for each selected path', function() {
        const variableDeclarator =
          b.variableDeclarator(b.identifier('foo'), null);
        const program = b.program([
          b.variableDeclaration('var', [variableDeclarator]),
          b.expressionStatement(b.identifier('foo')),
          b.expressionStatement(b.identifier('bar'))
        ]);

        const decl = Collection.fromNodes([program])
          .find(types.Identifier)
          .getVariableDeclarators(p => p.value.name);
        expect(decl.length).toBe(1);
        expect(decl.nodes()[0]).toBe(variableDeclarator);
      });
    });
  });

  describe('Mutation', function() {
    describe('replaceWith', function() {
      it('handles simple AST node replacement', function() {
        const ast = b.sequenceExpression([ // eslint-disable-line no-shadow
          b.identifier('foo'),
          b.literal('asd'),
          b.identifier('bar'),
        ]);
        const newNode = b.identifier('xyz');

        const S = Collection.fromNodes([ast]);
        S.find(types.Identifier, {name: 'bar'})
          .replaceWith(newNode);

        expect(S.nodes()[0].expressions[2]).toBe(newNode);
      });

      it('accepts an array as replacement', function() {
        const ast = b.sequenceExpression([   // eslint-disable-line no-shadow
          b.identifier('foo'),
          b.literal('asd'),
          b.identifier('bar'),
        ]);
        const newNode1 = b.identifier('xyz');
        const newNode2 = b.identifier('jkl');

        const S = Collection.fromNodes([ast]);
        S.find(types.Identifier, {name: 'bar'})
          .replaceWith([newNode1, newNode2]);

        expect(S.nodes()[0].expressions[2]).toBe(newNode1);
        expect(S.nodes()[0].expressions[3]).toBe(newNode2);
      });

      it('accepts a function as replacement ', function() {
        const ast = b.sequenceExpression([ // eslint-disable-line no-shadow
          b.identifier('foo'),
          b.literal('asd'),
          b.identifier('bar'),
        ]);

        const expectedArgs = [b.identifier('foo'), b.identifier('bar')];
        const receivedArgs = [];
        const replaceFunction =
          jest.fn(function(path, i) {
            // We have to keep a reference to the argument before it gets
            // replaced
            receivedArgs.push(path.value);
            return b.identifier(path.value.name + i);
          });

        const S = Collection.fromNodes([ast]);
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
        const ast = b.variableDeclaration( // eslint-disable-line no-shadow
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        const one = b.variableDeclarator(b.identifier('one'), null);

        Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertBefore(one);

        expect(ast.declarations.length).toBe(2);
        expect(ast.declarations[0]).toBe(one);
      });

      it('accepts an array of nodes', function() {
        const ast = b.variableDeclaration( // eslint-disable-line no-shadow
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        const one = b.variableDeclarator(b.identifier('one'), null);
        const two = b.variableDeclarator(b.identifier('two'), null);

        Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertBefore([one, two]);

        expect(ast.declarations.length).toBe(3);
        expect(ast.declarations[0]).toBe(one);
        expect(ast.declarations[1]).toBe(two);
      });

      it('accepts a function', function() {
        const x = b.identifier('x');
        const foo = b.identifier('foo');
        const bar = b.identifier('bar');
        const ast = b.sequenceExpression([foo, bar]); // eslint-disable-line no-shadow

        Collection.fromNodes([ast])
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
        const ast = b.variableDeclaration( // eslint-disable-line no-shadow
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        const one = b.variableDeclarator(b.identifier('one'), null);

        Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertAfter(one);

        expect(ast.declarations.length).toBe(2);
        expect(ast.declarations[1]).toBe(one);
      });

      it('accepts an array of nodes', function() {
        const ast = b.variableDeclaration( // eslint-disable-line no-shadow
          'var',
          [b.variableDeclarator(b.identifier('foo'), null)]
        );
        const one = b.variableDeclarator(b.identifier('one'), null);
        const two = b.variableDeclarator(b.identifier('two'), null);

        Collection.fromNodes([ast])
          .find(types.VariableDeclarator)
          .insertAfter([one, two]);

        expect(ast.declarations.length).toBe(3);
        expect(ast.declarations[1]).toBe(one);
        expect(ast.declarations[2]).toBe(two);
      });

      it('accepts a function', function() {
        const x = b.identifier('x');
        const foo = b.identifier('foo');
        const bar = b.identifier('bar');
        const ast = b.sequenceExpression([foo, bar]); // eslint-disable-line no-shadow

        Collection.fromNodes([ast])
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

    describe('removes', function() {
      it('removes a node if it is part of the body of a statement', function() {
        const x = b.expressionStatement(b.identifier('x'));
        const y = b.expressionStatement(b.identifier('y'));
        const ast = b.program([x, y]); // eslint-disable-line no-shadow

        Collection.fromNodes([ast])
          .find(types.Identifier, {name: 'x'})
          .remove();

        expect(ast.body.length).toBe(1);
        expect(ast.body[0]).toBe(y);
      });

      it('removes a node if it is a function param', function() {
        const x = b.identifier('x');
        const y = b.identifier('y');
        const ast = b.arrowFunctionExpression( // eslint-disable-line no-shadow
          [x, b.identifier('z')],
          y
        );

        Collection.fromNodes([ast])
          .find(types.Identifier, {name: 'z'})
          .remove();
        expect(ast.params.length).toBe(1);
        expect(ast.params[0]).toBe(x);
        expect(ast.body).toBe(y);
      });
    });
  });
});
