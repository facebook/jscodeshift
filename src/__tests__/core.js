jest.autoMockOff();
var core = require('../core');
var Collection = require('../Collection');

describe('core API', function() {
  it('returns a Collection object', function() {
    expect(core('var foo;') instanceof Collection).toBe(true);
  });
});
