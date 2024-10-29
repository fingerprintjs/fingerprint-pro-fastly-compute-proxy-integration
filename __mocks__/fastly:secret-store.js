const store = new Map()
export class ConfigStore {
  constructor(storeName) {
    this.storeName = storeName
  }

  get(key) {
    return store.get(key) || null
  }

  set(key, value) {
    store.set(key, value)
  }
}
