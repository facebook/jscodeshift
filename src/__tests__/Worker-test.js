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

const fs = require('fs');
const createTempFolder = require('../../utils/createTempFolder');

function getFileContent(filePath) {
  return fs.readFileSync(filePath).toString();
}

describe('Worker API', () => {
  let worker;

  beforeEach(() => {
    worker = require('../Worker');
  });

  it('transforms files', done => {
    const tempFolder = createTempFolder();
    const transformPath =
      tempFolder.createTransformWith('return fileInfo.source + " changed";');
    const sourcePath = tempFolder.createFileWith('foo');
    const emitter = worker([transformPath]);

    emitter.send({files: [sourcePath]});
    emitter.once('message', (data) => {
      expect(data.status).toBe('ok');
      expect(data.msg).toBe(sourcePath);
      expect(getFileContent(sourcePath)).toBe('foo changed');
      done();
    });
  });

  describe('custom parser', () => {
    function getTransformForParser(tempFolder, parser) {
      return tempFolder.createFileWith(
        `function transform(fileInfo, api) {
          api.jscodeshift(fileInfo.source);
          return "changed";
         }
         ${parser ? `transform.parser = '${parser}';` : ''}
         module.exports = transform;
        `
      );
    }
    function getSourceFile(tempFolder) {
      // This code cannot be parsed by Babel v5
      return tempFolder.createFileWith(
         'const x = (a: Object, b: string): void => {}'
      );
    }

    it('errors if new flow type code is parsed with babel v5', done => {
      const tempFolder = createTempFolder();
      const transformPath = tempFolder.createTransformWith(
        'api.jscodeshift(fileInfo.source); return "changed";'
      );
      const sourcePath = getSourceFile(tempFolder);
      const emitter = worker([transformPath]);

      emitter.send({files: [sourcePath]});
      emitter.once('message', (data) => {
        expect(data.status).toBe('error');
        expect(data.msg).toMatch('SyntaxError');
        done();
      });
    });

    it('uses babylon if configured as such', done => {
      const tempFolder = createTempFolder();
      const transformPath = getTransformForParser(tempFolder, 'babylon');
      const sourcePath = getSourceFile(tempFolder);
      const emitter = worker([transformPath]);

      emitter.send({files: [sourcePath]});
      emitter.once('message', (data) => {
        expect(data.status).toBe('ok');
        expect(getFileContent(sourcePath)).toBe('changed');
        done();
      });
    });

    it('uses flow if configured as such', done => {
      const tempFolder = createTempFolder();
      const transformPath = getTransformForParser(tempFolder, 'flow');
      const sourcePath = getSourceFile(tempFolder);
      const emitter = worker([transformPath]);

      emitter.send({files: [sourcePath]});
      emitter.once('message', (data) => {
        expect(data.status).toBe('ok');
        expect(getFileContent(sourcePath)).toBe('changed');
        done();
      });
    });

  });

});
