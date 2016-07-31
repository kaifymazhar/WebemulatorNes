import log from '../../../core/src/common/log';
import {nvramStore} from './database';

export default class NVRAM {

  constructor(nes) {
    log.info('Initializing NVRAM access');
    this.nes = nes;
  }

  size() {
    log.info('Getting NVRAM size');
    return this.nes.getNVRAMSize();
  }

  get() {
    log.info('Getting NVRAM');
    return this.nes.getNVRAM();
  }

  set(data) {
    log.info('Setting NVRAM');
    return this.nes.setNVRAM(data);
  }

  load() {
    return new Promise((resolve, reject) => {
      if (this.size()) {
        const sha1 = this.nes.getCartridge().sha1;
        nvramStore.get(sha1)
          .then(data => data && this.set(data))
          .then(resolve, reject);
      } else {
        resolve();
      }
    });
  }

  save() {
    return new Promise((resolve, reject) => {
      const data = this.get();
      if (data) {
        const sha1 = this.nes.getCartridge().sha1;
        nvramStore.put(sha1, data).then(resolve, reject);
      } else {
        resolve();
      }
    });
  }

  delete() {
    return nvramStore.clear();
  }

}