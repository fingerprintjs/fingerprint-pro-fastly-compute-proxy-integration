const store = new Map()
export class SecretStore {
  constructor(storeName) {
    this.storeName = storeName
  }

  async get(key) {
    return {
      plaintext: () => {
        return store.get(key) || null
      },
    }
  }

  set(key, value) {
    store.set(key, value)
  }
}
