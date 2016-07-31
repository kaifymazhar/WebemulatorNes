import log from '../../../core/src/common/log';
import Region from '../../../core/src/common/Region';
import Options from '../data/Options';
import FpsCounter from './FpsCounter';

const regions = {
  'auto': null,
  'ntsc': Region.NTSC,
  'pal': Region.PAL,
};

export default class System {

  constructor(nes, video, audio, sources) {
    log.info('Initializing system');
    this.nes = nes;
    this.video = video;
    this.audio = audio;
    this.sources = sources;
    this.fps = new FpsCounter;
    this.initListeners();
    this.initOptions();
  }

  initListeners() {
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
  }

  initOptions() {
    this.options = new Options(this);
    this.options.add('region', this.setRegion, this.getRegion, 'auto');
    this.options.add('speed', this.setSpeed, this.getSpeed, 1);
    this.options.reset();
  }

  //=========================================================
  // Events
  //=========================================================

  onVisibilityChange() {
    if (document.hidden) {
      log.info('Lost visibility');
      this.autoPaused = this.isRunning();
      this.stop();
    } else {
      log.info('Gained visibility');
      if (this.autoPaused) {
        this.start();
      }
    }
  }

  //=========================================================
  // Execution
  //=========================================================

  // We are using setInterval over setTimout for 2 reasons:
  // - it ensures much more stable frame rate (especially when emulation speed > 1)
  // - its calls won't overlap because there is no async code

  start() {
    if (!this.isRunning()) {
      log.info('Starting execution');
      const period = 1000 / (this.speed * this.getTargetFPS());
      this.execId = setInterval(() => this.step(), period);
      this.audio.setActive(true);
      this.sources.setActive(true);
    }
  }

  stop() {
    if (this.isRunning()) {
      log.info('Stopping execution');
      clearInterval(this.execId);
      cancelAnimationFrame(this.drawId);
      this.execId = null;
      this.audio.setActive(false);
      this.sources.setActive(false);
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  isRunning() {
    return this.execId != null;
  }

  step() {
    this.video.renderFrame();
    this.fps.update();
    cancelAnimationFrame(this.drawId); // In case we are running faster than browser refresh rate
    this.drawId = requestAnimationFrame(() => this.video.drawFrame());
  }

  //=========================================================
  // Reset
  //=========================================================

  hardReset() {
    log.info('Hard reset');
    this.nes.hardReset();
  }

  softReset() {
    log.info('Soft reset');
    this.nes.softReset();
  }

  //=========================================================
  // Region
  //=========================================================

  setRegion(name) {
    if (this.regionName !== name) {
      log.info(`Setting region to "${name}"`);
      this.regionName = name;
      this.nes.setRegion(regions[name]);
      if (this.isRunning()) {
        this.restart(); // To refresh step period
      }
    }
  }

  getRegion() {
    return this.regionName;
  }

  //=========================================================
  // Speed
  //=========================================================

  setSpeed(speed) {
    if (this.speed !== speed) {
      log.info(`Setting emulation speed to ${speed}x`);
      this.speed = speed;
      this.audio.setSpeed(speed);
      if (this.isRunning()) {
        this.restart(); // To refresh step period
      }
    }
  }

  getSpeed() {
    return this.speed;
  }

  //=========================================================
  // FPS
  //=========================================================

  getFPS() {
    return this.fps.get();
  }

  getTargetFPS() {
    const region = this.nes.getUsedRegion();
    return Region.getParams(region).framesPerSecond;
  }

}