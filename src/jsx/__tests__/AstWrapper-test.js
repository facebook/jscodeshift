/* eslint-disable no-unused-vars */
const AstWrapper = require('../AstWrapper');
const jsx = require('../index');
const  {
  MemberExpression,
  CallExpression,
  Identifier,
} = jsx;

const fixture = require('./fixture');

describe('AstWrapper', () => {

  it('.length() should return the top-level node count', () => {
    const wrapper = new AstWrapper(fixture.variableDeclarations());
    expect(wrapper.length()).toEqual(2);
  });

  it('.type() should return the top-level node type', () => {
    const wrapper = new AstWrapper(fixture.variableDeclaration());
    expect(wrapper.type()).toEqual('VariableDeclaration');
    const result = wrapper.find(<Identifier />);
    expect(result.type()).toEqual('Identifier');
  });

  it('.toSource() should print the ast', () => {
    const wrapper = new AstWrapper(fixture.variableDeclaration());
    expect(wrapper.toSource()).toEqual('var a;');
  })

  it('.at() should return the top-level node at index', () => {
    const wrapper = new AstWrapper(fixture.variableDeclarations());
    expect(wrapper.at(0).prop('kind')).toEqual('var');
  });

  it('.prop() should return a node property', () => {
    const wrapper = new AstWrapper(fixture.callExpression());
    expect(wrapper.prop('arguments')[0].type)
      .toEqual('ArrowFunctionExpression');
  });

  it('.prop() should throw when called on multiple nodes', () => {
    const wrapper = new AstWrapper(fixture.variableDeclarations());
    expect(wrapper.prop.bind(wrapper, 'name')).toThrow();
  });

  it('.forEach() should iterate over all nodes', () => {
    const wrapper = new AstWrapper(fixture.variableDeclarations());
    const callback = jest.fn();
    wrapper.forEach(callback);
    expect(callback.mock.calls.length).toEqual(wrapper.length());
    expect(callback.mock.calls[0][0].ast).toEqual(wrapper.ast.nodes()[0]);
    expect(callback.mock.calls[1][0].ast).toEqual(wrapper.ast.nodes()[1]);
  });

  it('.remove() should remove the node and all children', () => {
    const wrapper = new AstWrapper(fixture.lodashCallExpression());
    wrapper.find(<CallExpression />).remove();
    expect(wrapper.find(<CallExpression />).length()).toEqual(0);
  });

  it('.setProp() should set a node value', () => {
    const wrapper = new AstWrapper(fixture.variableDeclaration());
    wrapper.find(<Identifier name="a" />).setProp('name', ':)');
    expect(wrapper.find(<Identifier />).prop('name')).toEqual(':)');
  });

  it('.setProp() should work on multiple nodes', () => {
    const wrapper = new AstWrapper(fixture.variableDeclarations());
    wrapper.find(<Identifier />).setProp('name', 'test');
    const identifiers = wrapper.find(<Identifier name="test" />);
    expect(identifiers.length()).toEqual(2);
  });

  it('.replaceWith() should replace the current node in the tree', () => {
    const wrapper = new AstWrapper(fixture.lodashCallExpression());
    wrapper.find(<Identifier name="_" />).replaceWith(
      <MemberExpression>
        <Identifier name="_" />
        <Identifier name="test" />
      </MemberExpression>
    );
    const identifiers = wrapper.find(<Identifier />);
    expect(identifiers.length()).toEqual(4);
    expect(identifiers.at(0).prop('name')).toEqual('result');
    expect(identifiers.at(1).prop('name')).toEqual('_');
    expect(identifiers.at(2).prop('name')).toEqual('test');
    expect(identifiers.at(3).prop('name')).toEqual('map');
  });

  it('.replaceWith() should work on multiple nodes', () => {
    const wrapper = new AstWrapper(fixture.variableDeclarations());
    wrapper.find(<Identifier />).replaceWith(<Identifier name="test" />);
    const identifiers = wrapper.find(<Identifier />);
    expect(identifiers.length()).toEqual(2);
    expect(identifiers.at(0).prop('name')).toEqual('test');
    expect(identifiers.at(1).prop('name')).toEqual('test');
  });

  it('.replaceWith() should take a function', () => {
    const wrapper = new AstWrapper(fixture.variableDeclarations());
    wrapper.find(<Identifier />).replaceWith(node => (
      <Identifier name={'_' + node.prop('name')} />
    ));
    const identifiers = wrapper.find(<Identifier />);
    expect(identifiers.length()).toEqual(2);
    expect(identifiers.at(0).prop('name')).toEqual('_a');
    expect(identifiers.at(1).prop('name')).toEqual('_b');
  });

  describe('.find()', () => {
    const wrapper = new AstWrapper(fixture.lodashCallExpression());

    it('should find a child', () => {
      const result = wrapper.find(<Identifier name="result" />);
      expect(result.length()).toEqual(1);
      expect(result.type()).toEqual('Identifier');
      expect(result.prop('name')).toEqual('result');
    });

    it('should find a nested child', () => {
      const result = wrapper.find(
        <CallExpression>
          <MemberExpression>
            <Identifier name="_" />
            <Identifier name="map" />
          </MemberExpression>
        </CallExpression>
      );
      expect(result.length()).toEqual(1);
      expect(result.type()).toEqual('CallExpression');
    });

    it('should handle custom functional components', () => {
      const Lodash = ({ method }) => {
        return (
          <CallExpression>
            <MemberExpression>
              <Identifier name="_" />
              <Identifier name={method} />
            </MemberExpression>
          </CallExpression>
        );
      };
      const result = wrapper.find(<Lodash method="map" />);
      expect(result.type()).toEqual('CallExpression');
    });

    it('should chain calls', () => {
      const result = wrapper
        .find(<MemberExpression />)
        .find(<Identifier name="_" />);
      expect(result.type()).toEqual('Identifier');
      expect(result.prop('name')).toEqual('_');
    });

  });

});
