/* eslint-env mocha */
/* eslint-disable no-sparse-arrays, no-unused-expressions */

import {expect} from 'chai';
import {createMapper} from '../../src/memory/mappers';

describe('memory/mappers', () => {
  const mappers = [
    'AOROM',
    'BNROM',
    'CNROM',
    'ColorDreams',
    'MMC1',
    'MMC3',
    'NINA-001',
    'NROM',
    'UNROM',
  ];

  for (const mapper of mappers) {
    it(`creates ${mapper} mapper`, () => {
      expect(createMapper({mapper})).to.be.an('object');
    });
  }

  it('throws error for an unknown mapper name', () => {
    expect(() => createMapper({})).to.throw(Error);
    expect(() => createMapper({mapper: 'x'})).to.throw(Error);
  });
});