"use strict";

jest.autoMockOff();

var Collection = require('../Collection');
var at = require('ast-types');
var types = at.namedTypes;
var b = at.builders;

describe('Collection API', function() {
  var ast;

  beforeEach(function() {
    ast = b.blockStatement([
      b.variableDeclaration(
        'var',
        [b.variableDeclarator(b.identifier('foo'), null)]
      ),
      b.variableDeclaration(
        'var',
        [b.variableDeclarator(b.identifier('bar'), null)]
      ),
      b.functionDeclaration(
        b.identifier('f'),
        [],
        b.blockStatement([
          b.variableDeclaration(
            'var',
            [b.variableDeclarator(b.identifier('baz'), null)]
          ),
          b.variableDeclaration(
            'var',
            [b.variableDeclarator(b.identifier('baz2'), null)]
          )
        ])
      ),
    ]);
  });

  describe('Traversal', function() {

    describe('find', function() {

      it('finds nodes by type', function() {
        var vars = Collection.create(ast).find(types.VariableDeclaration);

        expect(vars.size()).toBe(4);
      });

      it('finds nodes by type and properties', function() {
        var vars = Collection.create(ast)
          .find(types.VariableDeclarator, {id: {name: 'bar'}});

        expect(vars.size()).toBe(1);
        expect(vars.nodes()[0]).toBe(ast.body[1].declarations[0]);
      });

      it('handles chained find calls properly', function() {
        var vars = Collection.create(ast)
          .find(types.FunctionDeclaration)
          .find(types.VariableDeclarator, {id: {name: 'baz'}});

        expect(vars.size()).toBe(1);
        expect(vars.nodes()[0]).toBe(
          ast.body[2].body.body[0].declarations[0]
        );
      });

      it('handles multi chain find calls properly', function() {
        var functionDeclarations = Collection.create(ast)
          .find(types.FunctionDeclaration);

        var bazDeclarations = functionDeclarations
          .find(types.VariableDeclarator, {id: {name: 'baz'}});
        var baz2Declarations = functionDeclarations
          .find(types.VariableDeclarator, {id: {name: 'baz2'}});

        expect(bazDeclarations.size()).toBe(1);
        expect(bazDeclarations.nodes()[0]).toBe(
          ast.body[2].body.body[0].declarations[0]
        );
        expect(baz2Declarations.size()).toBe(1);
        expect(baz2Declarations.nodes()[0]).toBe(
          ast.body[2].body.body[1].declarations[0]
        );
      });

    });

    describe('filter', function() {

      it('lets you filter with custom logic', function() {
        var filter = jest.genMockFunction().mockImplementation(function(path) {
          return path.value.id.name[0] === 'f';
        });
        var fVariables = Collection.create(ast)
          .find(types.VariableDeclarator)
          .filter(filter);

        expect(filter.mock.calls.length).toBe(4);
        expect(fVariables.size()).toBe(1);
      });

    });

    describe('forEach', function() {

      it('lets you iterate over each element of an collection', function() {
        var each = jest.genMockFunction();
        var fVariables = Collection.create(ast)
          .find(types.VariableDeclarator);
        var result = fVariables.forEach(each);

        expect(each.mock.calls.length).toBe(4);
        expect(result).toBe(fVariables);
      });

    });

  });

  describe('Mutation', function() {

    describe('replaceWith', function() {

      it('handles simple AST node replacement', function() {
        var newNode = b.variableDeclarator(b.identifier('xyz'), null);
        var S = Collection.create(ast);
        S.find(types.VariableDeclarator, {id:{name: 'bar'}})
          .replaceWith(newNode);

        expect(S.nodes()[0].body[1].declarations[0]).toBe(newNode);
      });

      it('accepts a function as replacement ', function() {
        var expectedArgs = [b.identifier('baz'), b.identifier('baz2')];
        var receivedArgs = [];
        var replaceFunction =
          jest.genMockFunction().mockImplementation(function(path, i) {
            // We have to keep a reference to the argument before it gets
            // replaced
            receivedArgs.push(path.value);
            return b.identifier(path.value.name + i);
          });

        var newNode = b.variableDeclarator(b.identifier('xyz'), null);
        var S = Collection.create(ast);
        S.find(types.FunctionDeclaration)
         .find(types.VariableDeclarator)
         .find(types.Identifier)
         .replaceWith(replaceFunction);

        expect(replaceFunction.mock.calls.length).toBe(2);
        expect(receivedArgs).toEqual(expectedArgs);
        // baz is properly replaced
        expect(S.nodes()[0].body[2].body.body[0].declarations[0].id)
          .toEqual(b.identifier('baz0'));
        // baz1 is properly replaced
        expect(S.nodes()[0].body[2].body.body[1].declarations[0].id)
          .toEqual(b.identifier('baz21'));
      });

    });

  });

});
