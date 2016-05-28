/* eslint-env mocha */

import childProcess from 'child_process';
import chai from 'chai';

const expect = chai.expect;

describe('Debugger', () => {
  it('should execute N steps', () => {
    expectResult(['../core/test/roms/nestest/nestest.nes', '-s3'], {
      status: 0,
      stderr: [],
      stdout: [
        'C004                 A:00 X:00 Y:00 P:24 SP:FD',
        'C005  78        SEI  A:00 X:00 Y:00 P:24 SP:FD',
        'C006  D8        CLD  A:00 X:00 Y:00 P:24 SP:FD',
        'C008  A2 FF     LDX  A:00 X:FF Y:00 P:A4 SP:FD',
      ],
    });
  });
});

function expectResult(args, {status, stdout, stderr}) {
  args.unshift('./bin/debugger');
  const result = childProcess.spawnSync('node', args);

  if (stderr !== undefined) {
    expect(readLines(result.stderr)).to.be.deep.equal(stderr, 'Different error output');
  }
  if (stdout !== undefined) {
    expect(readLines(result.stdout)).to.be.deep.equal(stdout, 'Different output');
  }
  if (status !== undefined) {
    expect(result.status).to.be.equal(status, 'Different exit code');
  }
}

function readLines(buffer) {
  const lines = buffer.toString().split('\n');
  lines.pop();
  return lines;
}
