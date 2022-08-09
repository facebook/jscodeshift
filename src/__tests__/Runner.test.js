const { add } = require('../ignoreFiles');
const { getAllFiles } = require('../Runner');

describe('getAllFiles', () => {
  it('basic', async () => {
    const list = await getAllFiles(['src/**/*-test.js'], () => true);
    expect(list.every((name) => name.endsWith('-test.js'))).toBe(true);
  });
  it('ignore', async () => {
    add('src/**/*-test.js');
    expect((await getAllFiles(['src/**/*-test.js'], () => true)).length).toBe(
      0
    );
    expect(
      (await getAllFiles(['src/**/*.js'], () => true)).every(
        (name) => name.endsWith('.js') && !name.endsWith('-test.js')
      )
    ).toBe(true);
  });
});
