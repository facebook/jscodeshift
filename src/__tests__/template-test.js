/*global jest, defined, it, expect, beforeEach*/

jest.autoMockOff();

let jscodeshift = require('../core');

describe('Templates', () => {
  let statements;
  let statement;
  let expression;

  beforeEach(() => {
    ({expression, statement, statements} = require('../template'));
  });

  it('interpolates expression nodes with source code', () => {

    let input =
`var foo = bar;
if(bar) {
  console.log(42);
}`;

    let expected =
`var foo = alert(bar);
if(alert(bar)) {
  console.log(42);
}`;

    expect(
      jscodeshift(input)
        .find('Identifier', {name: 'bar'})
        .replaceWith(path => expression`alert(${path.node})`)
        .toSource()
    ).toEqual(expected);
  });

  it('interpolates statement nodes with source code', () => {
    let input =
`for (var i = 0; i < 10; i++) {
  console.log(i);
  console.log(i / 2);
}`;

    let expected =
`var i = 0;

while (i < 10) {
  console.log(i);
  console.log(i / 2);
  i++;
}`;

    expect(
      jscodeshift(input)
        .find('ForStatement')
        .replaceWith(
          ({node}) => statements`
            ${node.init};
            while (${node.test}) {
              ${node.body.body}
              ${node.update}
            }`
        )
        .toSource()
    ).toEqual(expected);
  });

  describe('explode arrays', () => {

    it('explodes arrays in function definitions', () => {
      let input = `var foo = [a, b];`;
      let expected = `var foo = function foo(a, b, c) {};`;

      expect(
        jscodeshift(input)
          .find('ArrayExpression')
          .replaceWith(
            ({node}) => expression`function foo(${node.elements}, c) {}`
          )
          .toSource()
      )
      .toEqual(expected);

      expected = `var foo = function(a, b, c) {};`;

      expect(
        jscodeshift(input)
          .find('ArrayExpression')
          .replaceWith(
            ({node}) => expression`function(${node.elements}, c) {}`
          )
          .toSource()
      )
      .toEqual(expected);

      expected = `var foo = (a, b) => {};`;

      expect(
        jscodeshift(input)
          .find('ArrayExpression')
          .replaceWith(
            ({node}) => expression`${node.elements} => {}`
          )
          .toSource()
      )
      .toEqual(expected);

      expected = `var foo = (a, b, c) => {};`;

      expect(
        jscodeshift(input)
          .find('ArrayExpression')
          .replaceWith(
            ({node}) => expression`(${node.elements}, c) => {}`
          )
          .toSource()
      )
      .toEqual(expected);
    });

    it('explodes arrays in variable declarations', () => {
      let input = `var foo = [a, b];`;
      let expected = `var foo, a, b;`;
      expect(
        jscodeshift(input)
          .find('VariableDeclaration')
          // Need to use a block here because the arrow doesn't seem to be
          // compiled with a line break after the return statement. Can't repro
          // outside here though
          .replaceWith(({node: {declarations: [node]}}) => {
            return statement`var ${node.id}, ${node.init.elements};`;
          })
          .toSource()
      )
      .toEqual(expected);
    });

    it('explodes arrays in array expressions', () => {
      let input = `var foo = [a, b];`;
      let expected = `var foo = [a, b, c];`;
      expect(
        jscodeshift(input)
          .find('ArrayExpression')
          .replaceWith(({node}) => expression`[${node.elements}, c]`)
          .toSource()
      )
      .toEqual(expected);
    });

    it('explodes arrays in object expressions', () => {
      let input = `var foo = {a, b};`;
      let expected = /var foo = \{\s*a,\s*b,\s*c: 42\s*};/;
      expect(
        jscodeshift(input)
          .find('ObjectExpression')
          .replaceWith(({node}) => expression`{${node.properties}, c: 42}`)
          .toSource()
      )
      .toMatch(expected);
    });

    it('explodes arrays in call expressions', () => {
      let input = `var foo = [a, b];`;
      let expected = `var foo = bar(a, b, c);`;

      expect(
        jscodeshift(input)
          .find('ArrayExpression')
          .replaceWith(
            ({node}) => expression`bar(${node.elements}, c)`
          )
          .toSource()
      )
      .toEqual(expected);
    });

  });

});
