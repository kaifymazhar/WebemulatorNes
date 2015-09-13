// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

//=============================================================================
// Collection of ROM-based tests
// Source: http://wiki.nesdev.com/w/index.php/Emulator_tests
//=============================================================================

import chai from 'chai';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import * as nestest from './nestest/nestest';
import * as instr_test from './instr_test/instr_test';
import * as instr_timing from './instr_timing/instr_timing';
import * as instr_misc from './instr_misc/instr_misc';
import * as cpu_reset from './cpu_reset/cpu_reset';
import * as ppu_tests from './ppu_tests/ppu_tests';
import * as ppu_vbl_nmi from './ppu_vbl_nmi/ppu_vbl_nmi';
import * as apu_reset from './apu_reset/apu_reset';
import * as apu_test from './apu_test/apu_test';
import * as mmc3_test from './mmc3_test/mmc3_test';
import * as bntest from './bntest/bntest';
import * as holydiverbatman from './holydiverbatman/holydiverbatman';
import coreConfig from '../../src/lib/core/config';
import Injector from '../../src/lib/core/utils/Injector';
import { dataToString } from '../../src/lib/core/utils/convert';
import { copyProperties, mergeProperties } from '../../src/lib/core/utils/objects';

describe('Validation ROMs', () => {
  validate(nestest);
  validate(instr_test);
  validate(instr_timing);
  validate(instr_misc); // 2 failing tests (disabled)
  validate(cpu_reset);
  validate(ppu_tests);
  validate(ppu_vbl_nmi);
  validate(apu_reset); // 4 failing tests (disabled)
  validate(apu_test); // 3 failing tests (disabled)
  validate(mmc3_test); // 2 failing tests (disabled)
  validate(bntest); // 2 failing tests (disabled)
  validate(holydiverbatman);
});

function validate(test) {
  var baseName = path.basename(test.dir);
  if (test.file) {
    var file = path.join(test.dir, test.file);
    var name = baseName;
    var environment = mergeProperties(test, {file, name});
    it(name, () => execute(environment));
  } else if (test.files) {
    for (let number = 0; number < test.files.length; number++) {
      let file = path.join(test.dir, test.files[number]);
      let name = path.basename(file, '.nes');
      let environment = mergeProperties(test, {file, name, number});
      it(`${baseName} (${name})`, () => execute(environment));
    }
  }
}

function execute(test) {
  // Read configuration
  var config = copyProperties(coreConfig);
  test.configure(config);

  // Setup emulator
  var injector = new Injector(config);
  var cartridgeFactory = injector.get('cartridgeFactory');
  var cartridge = cartridgeFactory.fromLocalFile(test.file);
  var cpuMemory = injector.get('cpuMemory');
  var nes = injector.get('nes');
  var ppu = injector.get('ppu');
  nes.insertCartridge(cartridge);

  // Prepare context
  var number = test.number;
  var assert = chai.assert;
  var expect = chai.expect;
  var context = {number, assert, expect, fail, get, power, reset, step,
    readByte, readString, screenshot, blargg, getPath, getOutputPath};

  // Execute test
  var asyncResults = [];
  test.execute(context);
  if (asyncResults.length) {
    return Promise.all(asyncResults);
  }

  // ==================== Helper functions ====================

  function fail(message) {
    assert(false, message);
  }

  function get(dependency) {
    return injector.get(dependency);
  }

  function power() {
    nes.pressPower();
  }

  function reset() {
    nes.pressReset();
  }

  function step(count = 1) {
    for (var i = 0; i < count; i++) {
      nes.step();
    }
  }

  function readByte(address) {
    return cpuMemory.read(address);
  }

  function readString(address) {
    var data = [];
    while (true) {
      var value = readByte(address++);
      if (value === 0) {
        break;
      }
      data.push(value);
    }
    return dataToString(data);
  }

  function screenshot(file) {
    var verifiedFile = getPath(file || test.name + '.png');
    var outputFile = getOutputPath(test.name + '.png');
    asyncResults.push(ppu.writeFrameToFile(outputFile).then(() => {
      return new Promise((resolve, reject) => {
        var verifiedBuffer = fs.readFileSync(verifiedFile);
        var outputBuffer = fs.readFileSync(outputFile);
        if (outputBuffer.equals(verifiedBuffer)) {
          resolve();
        } else {
          reject(new Error(`Screenshot ${outputFile} does not match ${verifiedFile}.`))
        }
      });
    }));
  }

  function blargg() {
    // Test code for all Blargg's test ROMs
    const RESULT_ADDRESS = 0x6000;
    const RESULT_RUNNING = 0x80;
    const RESULT_RESET = 0x81;
    const RESULT_OK = 0x00;
    const MESSAGE_ADDRESS = 0x6004;

    var result;
    while ((result = readByte(RESULT_ADDRESS)) !== RESULT_RUNNING) {
      step(); // Wait until test starts
    }
    while ((result = readByte(RESULT_ADDRESS)) === RESULT_RUNNING) {
      step(); // Wait while test is in progress
    }
    if (result === RESULT_RESET) {
      step(200000); // Reset needs to be done at least after 100 msec (~122880 cpu ticks)
      reset();
      while ((result = readByte(RESULT_ADDRESS)) !== RESULT_RUNNING) {
        step(); // Wait until test resumes
      }
      while ((result = readByte(RESULT_ADDRESS)) === RESULT_RUNNING) {
        step(); // Wait while test is in progress
      }
    }

    var message = readString(MESSAGE_ADDRESS);
    assert(result === RESULT_OK, '\n' + message);
  }

  function getPath(...names) {
    return path.join(test.dir, ...names);
  }

  function getOutputPath(...names) {
    var dir = 'out';
    mkdirp(getPath(dir));
    return getPath(dir, ...names);
  }
}