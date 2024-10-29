export class CacheOverride {
  constructor(mode, options) {
    this.mode = mode
    this.options = options
  }

  getMode() {
    return this.mode
  }

  getOptions() {
    return this.options
  }
}
