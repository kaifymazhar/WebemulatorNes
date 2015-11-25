//=============================================================================
// Test:   mmc3_test
// Source: http://blargg.8bitalley.com/parodius/nes-tests/mmc3_test_2.zip
//=============================================================================

import { DisabledAPU, NoOutputPPU } from '../units';

export const dir = './test/roms/mmc3_test';

export const files = [
  '1-clocking.nes',
  '2-details.nes',
  '3-A12_clocking.nes',
  // '4-scanline_timing.nes',
  '5-MMC3.nes',
  // '6-MMC3_alt.nes',
];

export function configure(config) {
  config.apu = {class: DisabledAPU};
  config.ppu = {class: NoOutputPPU};
}

export function execute(test) {
  test.blargg();
}