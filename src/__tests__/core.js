"use strict";
jest.autoMockOff();
var core = require('../core');
var Collection = require('../Collection');
var recast = require('recast');
var b = recast.types.builders;
var NodePath = recast.types.NodePath;

describe('core API', function() {
  it('returns a Collection from a source string', function() {
    expect(core('var foo;').constructor.name ).toContain('Collection');
  });

  it('returns a Collection from an AST node', function() {
    var node = b.identifier('foo');
    expect(core(node).constructor.name).toContain('Collection');
  });

  it('returns a Collection from an array of AST nodes', function() {
    var node = b.identifier('foo');
    expect(core([node]).constructor.name).toContain('Collection');
  });

  it('returns a Collection from a path', function() {
    var path = new NodePath(b.identifier('foo'));
    expect(core(path).constructor.name).toContain('Collection');
  });

  it('returns a Collection from an array of paths', function() {
    var path = new NodePath(b.identifier('foo'));
    expect(core([path]).constructor.name).toContain('Collection');
  });

  it('returns a Collection from an empty array', function() {
    expect(core([]).constructor.name).toContain('Collection');
  });

  it('throws if it gets an invalid value', function() {
    expect(_ => core(42)).toThrow();
    expect(_ => core({})).toThrow();
  });

});
