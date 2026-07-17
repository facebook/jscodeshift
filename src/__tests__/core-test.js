
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/*global jest, describe, it, expect*/

const core = require('../core');
const recast = require('recast');
const b = recast.types.builders;
const NodePath = recast.types.NodePath;

describe('core API', function() {
  it('returns a Collection from a source string', function() {
    expect(core('var foo;').constructor.name ).toContain('Collection');
  });

  it('returns a Collection from an AST node', function() {
    const node = b.identifier('foo');
    expect(core(node).constructor.name).toContain('Collection');
  });

  it('returns a Collection from an array of AST nodes', function() {
    const node = b.identifier('foo');
    expect(core([node]).constructor.name).toContain('Collection');
  });

  it('returns a Collection from a path', function() {
    const path = new NodePath(b.identifier('foo'));
    expect(core(path).constructor.name).toContain('Collection');
  });

  it('returns a Collection from an array of paths', function() {
    const path = new NodePath(b.identifier('foo'));
    expect(core([path]).constructor.name).toContain('Collection');
  });

  it('returns a Collection from an empty array', function() {
    expect(core([]).constructor.name).toContain('Collection');
  });

  it('throws if it gets an invalid value', function() {
    expect(() => core(42)).toThrow();
    expect(() => core({})).toThrow();
  });

  it('returns the source as is if nothing was modified', function () {
    const source = '\nvar foo;\n';
    expect(core(source).toSource()).toEqual(source);
  });

  it('plugins are called with core', function (done) {
    core.use(function (j) {
      expect(j).toBe(core);
      done();
    });
  });

  it('returns a Collection from a TypeScript interface declaration', function () {
    const source = 'interface Foo { bar: string; }';
    const ast = recast.parse(source, { parser: require('@typescript-eslint/typescript-estree') });
    const interfaceDecl = ast.program.body[0];
    expect(core(interfaceDecl).constructor.name).toContain('Collection');
  });

  it('plugins are only registered once', function () {
    let ct = 0;

    function plugin() {
      ct++;
    }

    core.use(plugin);
    core.use(plugin);

    expect(ct).toBe(1);
  });

});
